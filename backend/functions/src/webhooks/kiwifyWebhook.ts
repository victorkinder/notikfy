import * as functions from "firebase-functions/v2";
import { Request, Response } from "express";
import * as crypto from "crypto";
import { logger } from "../utils/logger";
import { formatError } from "../utils/errors";
import { KIWIFY } from "../config/constants";
import {
  KiwifyWebhookPayload,
  mapKiwifyProductToPlan,
} from "../models/signature.model";
import {
  createSignature,
  updateSignatureStatus,
  findSignatureByEmail,
} from "../services/signature.service";
import { sendActivationEmail } from "../services/email.service";
import { revokeUserTokens } from "../services/auth.service";
import { PLANS } from "../models/activation.model";
import { ValidationError, UnauthorizedError } from "../utils/errors";

/**
 * Valida a assinatura HMAC do webhook da Kiwify
 * A assinatura vem no query parameter "signature" e é calculada usando HMAC SHA1
 */
function validateKiwifyWebhook(req: Request): void {
  const signature = (req.query.signature as string) || "";

  if (!signature) {
    throw new UnauthorizedError("Assinatura do webhook não fornecida");
  }

  if (!KIWIFY.SECRET_KEY) {
    throw new UnauthorizedError(
      "Chave secreta da Kiwify não configurada. Configure KIWIFY_SECRET_KEY ou KIWIFY_WEBHOOK_TOKEN"
    );
  }

  // Serializa o payload JSON no formato compacto (sem espaços, igual ao Python)
  // Isso garante que a assinatura seja calculada da mesma forma que a Kiwify
  // O Python usa: json.dumps(payload, separators=(',', ':'), ensure_ascii=False)
  const payload = JSON.stringify(req.body);

  // Calcula a assinatura esperada usando HMAC SHA1
  const calculatedSignature = crypto
    .createHmac("sha1", KIWIFY.SECRET_KEY)
    .update(payload)
    .digest("hex");

  // Compara as assinaturas (comparação segura contra timing attacks)
  if (signature !== calculatedSignature) {
    logger.warn("Assinatura do webhook inválida", {
      received: signature.substring(0, 10) + "...",
      expected: calculatedSignature.substring(0, 10) + "...",
    });
    throw new UnauthorizedError("Assinatura do webhook inválida");
  }
}

/**
 * Processa evento de compra aprovada (order_approved)
 */
async function handleOrderApproved(
  payload: KiwifyWebhookPayload
): Promise<void> {
  if (!payload.Customer?.email) {
    throw new ValidationError("Email do cliente não encontrado no payload");
  }

  const email = payload.Customer.email.toLowerCase().trim();

  // Verifica se já existe assinatura para este email
  const existing = await findSignatureByEmail(email);
  if (existing) {
    logger.warn("Tentativa de criar assinatura duplicada", { email });
    // Atualiza a assinatura existente em vez de criar nova
    await updateSignatureStatus(email, "active");
    return;
  }

  // Mapeia product_id da Kiwify para nosso planId
  const productId = payload.Product?.product_id;
  let planId = mapKiwifyProductToPlan(productId);

  // Se não houver mapeamento, tenta inferir pelo nome do produto
  if (!planId) {
    const productName = payload.Product?.product_name?.toLowerCase() || "";

    if (productName.includes("iniciante") || productName.includes("starter")) {
      planId = "STARTER";
    } else if (
      productName.includes("escalando") ||
      productName.includes("scaling")
    ) {
      planId = "SCALING";
    } else if (
      productName.includes("escalado") ||
      productName.includes("scaled")
    ) {
      planId = "SCALED";
    }
  }

  if (!planId) {
    throw new ValidationError(
      "Não foi possível determinar o plano do produto. Configure o mapeamento de produtos na Kiwify ou use nomes de produtos que contenham: 'Iniciante', 'Escalando' ou 'Escalado'"
    );
  }

  const plan = PLANS[planId];
  const signature = await createSignature({
    email,
    planId,
    planName: plan.name,
    kiwifyOrderId: payload.order_id,
    kiwifyCustomerId: payload.subscription_id || payload.Subscription?.id,
  });

  // Envia email com access_token
  await sendActivationEmail(email, signature.access_token, plan.name);

  logger.info("Assinatura criada via webhook Kiwify", {
    email,
    planId,
    orderId: payload.order_id,
  });
}

/**
 * Processa evento de renovação de assinatura (subscription_renewed)
 */
async function handleSubscriptionRenewed(
  payload: KiwifyWebhookPayload
): Promise<void> {
  if (!payload.Customer?.email) {
    throw new ValidationError("Email do cliente não encontrado no payload");
  }

  const email = payload.Customer.email.toLowerCase().trim();

  // Atualiza status da assinatura para ativa
  await updateSignatureStatus(email, "active");

  logger.info("Assinatura renovada via webhook Kiwify", {
    email,
    orderId: payload.order_id,
    subscriptionId: payload.subscription_id,
  });
}

/**
 * Processa evento de cancelamento de assinatura (subscription_canceled)
 */
async function handleSubscriptionCanceled(
  payload: KiwifyWebhookPayload
): Promise<void> {
  if (!payload.Customer?.email) {
    throw new ValidationError("Email do cliente não encontrado no payload");
  }

  const email = payload.Customer.email.toLowerCase().trim();

  // Atualiza status da assinatura
  await updateSignatureStatus(email, "cancelled");

  // Revoga tokens do usuário
  await revokeUserTokens(email);

  logger.info("Assinatura cancelada e tokens revogados", {
    email,
    orderId: payload.order_id,
    subscriptionId: payload.subscription_id,
  });
}

/**
 * Processa evento de chargeback
 */
async function handleChargeback(payload: KiwifyWebhookPayload): Promise<void> {
  if (!payload.Customer?.email) {
    throw new ValidationError("Email do cliente não encontrado no payload");
  }

  const email = payload.Customer.email.toLowerCase().trim();

  // Atualiza status da assinatura para refunded (chargeback é similar a reembolso)
  await updateSignatureStatus(email, "refunded");

  // Revoga tokens do usuário
  await revokeUserTokens(email);

  logger.info("Chargeback processado e tokens revogados", {
    email,
    orderId: payload.order_id,
    subscriptionId: payload.subscription_id,
  });
}

/**
 * Cloud Function HTTP para receber webhooks da Kiwify
 * POST /kiwifyWebhook?signature=<hmac-signature>
 * A assinatura é calculada usando HMAC SHA1 do payload JSON com a chave secreta
 */
export const kiwifyWebhook = functions.https.onRequest(
  {
    cors: true,
  },
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Apenas aceita POST
      if (req.method !== "POST") {
        res.status(405).json({
          success: false,
          error: "MethodNotAllowed",
          message: "Método não permitido. Use POST.",
        });
        return;
      }

      // Valida body primeiro
      if (!req.body || typeof req.body !== "object") {
        throw new ValidationError("Corpo da requisição inválido");
      }

      // Valida assinatura do webhook (precisa do body parseado)
      validateKiwifyWebhook(req);

      const payload = req.body as KiwifyWebhookPayload;

      if (!payload.webhook_event_type) {
        throw new ValidationError(
          "Tipo de evento (webhook_event_type) não especificado no payload"
        );
      }

      logger.info("Webhook da Kiwify recebido", {
        event: payload.webhook_event_type,
        orderId: payload.order_id,
        orderStatus: payload.order_status,
      });

      // Processa evento baseado no tipo
      switch (payload.webhook_event_type) {
        case "order_approved":
          await handleOrderApproved(payload);
          break;

        case "subscription_renewed":
          await handleSubscriptionRenewed(payload);
          break;

        case "subscription_canceled":
          await handleSubscriptionCanceled(payload);
          break;

        case "chargeback":
          await handleChargeback(payload);
          break;

        default:
          logger.warn("Evento não suportado", {
            event: payload.webhook_event_type,
          });
          res.status(200).json({
            success: true,
            message: "Evento recebido mas não processado",
            event: payload.webhook_event_type,
          });
          return;
      }

      res.status(200).json({
        success: true,
        message: "Webhook processado com sucesso",
        event: payload.webhook_event_type,
      });
    } catch (error) {
      logger.error("Erro ao processar webhook da Kiwify", error);
      const errorResponse = formatError(error);
      const statusCode =
        error instanceof UnauthorizedError
          ? 401
          : error instanceof ValidationError
            ? 400
            : 500;
      res.status(statusCode).json(errorResponse);
    }
  }
);
