import * as functions from "firebase-functions/v2";
import { Request, Response } from "express";
import { logger } from "../utils/logger";
import { formatError } from "../utils/errors";
import { ValidationError, UnauthorizedError } from "../utils/errors";
import {
  processSaleWithAccumulatedCommission,
  extractCommissionFromWebhook,
} from "../services/sale.service";
import { CreateSaleData } from "../models/sale.model";
import {
  enqueueSaleNotification,
  enqueueAccumulatedCommissionNotification,
} from "../services/taskQueue.service";
import { validateWebhookSignature } from "../services/tiktok-webhook.service";
import { db } from "../config/firebase.config";
import { COLLECTIONS } from "../config/constants";
import { User } from "../models/user.model";
import { TikTokProfile } from "../models/tiktok-profile.model";

/**
 * Interface para payload de webhook do TikTok Shop
 */
interface TikTokWebhookPayload {
  event_type?: string;
  shop_id?: string;
  data?: {
    order_id?: string;
    order_status?: string;
    order_amount?: {
      amount?: string;
      currency?: string;
    };
    items?: Array<{
      product_name?: string;
      quantity?: number;
      price?: {
        amount?: string;
        currency?: string;
      };
    }>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Encontra usuário e perfil pelo shopId
 */
async function findUserByShopId(
  shopId: string
): Promise<{ userId: string; username: string } | null> {
  try {
    // Busca em todos os usuários (pode ser otimizado com índice)
    const usersSnapshot = await db
      .collection(COLLECTIONS.USUARIOS)
      .where("tiktokProfiles", "!=", null)
      .get();

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data() as User;
      const profiles: TikTokProfile[] = userData.tiktokProfiles || [];

      for (const profile of profiles) {
        if (profile.oauth?.shopId === shopId) {
          return {
            userId: userDoc.id,
            username: profile.username,
          };
        }
      }
    }

    return null;
  } catch (error) {
    logger.error("Erro ao buscar usuário por shopId", { shopId, error });
    return null;
  }
}

/**
 * Extrai userId do payload ou identifica pelo shopId
 */
async function extractUserId(payload: TikTokWebhookPayload): Promise<string> {
  // Tenta encontrar pelo shopId
  if (payload.shop_id) {
    const userData = await findUserByShopId(payload.shop_id);
    if (userData) {
      return userData.userId;
    }
  }

  // Tenta extrair do payload diretamente
  if (payload.data && typeof payload.data === "object") {
    const userId = (payload.data as Record<string, unknown>).userId as string;
    if (userId) {
      return userId;
    }
  }

  throw new ValidationError(
    "ID do usuário não encontrado no payload. shopId não corresponde a nenhum perfil conectado."
  );
}

/**
 * Converte payload do TikTok para formato de venda
 */
function convertTikTokPayloadToSaleData(
  payload: TikTokWebhookPayload,
  userId: string
): CreateSaleData {
  const data = payload.data || {};
  const orderId = data.order_id || payload.order_id || "unknown";
  const orderAmount = data.order_amount || {};
  const amount = parseFloat(
    (orderAmount.amount as string) || (orderAmount as unknown as string) || "0"
  );
  const currency =
    (orderAmount.currency as string) || (data.currency as string) || "BRL";

  // Tenta obter nome do produto dos itens
  let productName = "Produto não especificado";
  if (data.items && Array.isArray(data.items) && data.items.length > 0) {
    const firstItem = data.items[0];
    productName = (firstItem.product_name as string) || productName;
  }

  // Determina status
  const orderStatus = (data.order_status as string) || payload.event_type || "";
  let status: "pending" | "completed" | "refunded" = "completed";
  if (orderStatus.includes("pending") || orderStatus.includes("processing")) {
    status = "pending";
  } else if (orderStatus.includes("refund") || orderStatus.includes("cancel")) {
    status = "refunded";
  }

  return {
    userId,
    orderId: String(orderId),
    productName,
    amount,
    currency,
    status,
    webhookData: payload,
    notificationSent: false,
  };
}

/**
 * Cloud Function HTTP para receber webhooks do TikTok Shop
 * POST /tiktokWebhook
 */
export const tiktokWebhook = functions.https.onRequest(
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

      // Valida body
      if (!req.body || typeof req.body !== "object") {
        throw new ValidationError("Corpo da requisição inválido");
      }

      const payload = req.body as TikTokWebhookPayload;

      // Valida assinatura HMAC se secret estiver configurado
      const webhookSecret = process.env.TIKTOK_WEBHOOK_SECRET;
      if (webhookSecret) {
        const signature = req.headers["x-tiktok-signature"] as string;
        if (!signature) {
          logger.warn("Webhook sem assinatura", {
            headers: req.headers,
          });
          // Em produção, pode querer rejeitar sem assinatura
          // throw new UnauthorizedError("Assinatura não fornecida");
        } else {
          const payloadString = JSON.stringify(payload);
          const isValid = validateWebhookSignature(
            payloadString,
            signature,
            webhookSecret
          );

          if (!isValid) {
            logger.warn("Assinatura de webhook inválida", {
              signature,
            });
            throw new UnauthorizedError("Assinatura inválida");
          }
        }
      }

      // Extrai userId
      const userId = await extractUserId(payload);

      // Extrai comissão do webhook (pode não estar presente)
      const commission = extractCommissionFromWebhook(payload);

      // Converte payload para formato de venda
      const saleData = convertTikTokPayloadToSaleData(payload, userId);

      logger.info("Webhook do TikTok recebido", {
        userId,
        orderId: saleData.orderId,
        eventType: payload.event_type,
        shopId: payload.shop_id,
      });

      // Processa venda com lógica de comissão acumulada
      const result = await processSaleWithAccumulatedCommission(
        userId,
        saleData,
        commission
      );

      // Enfileira notificações para processamento assíncrono
      let taskId: string | undefined;
      try {
        if (result.shouldNotify && result.notificationData) {
          // Enfileira notificação de comissão acumulada
          taskId = await enqueueAccumulatedCommissionNotification(
            userId,
            result.notificationData.accumulatedAmount,
            result.notificationData.threshold
          );
        } else if (result.notificationType === "sale") {
          // Enfileira notificação de venda se tipo for "sale"
          taskId = await enqueueSaleNotification(userId, {
            productName: saleData.productName,
            amount: saleData.amount,
            currency: saleData.currency,
            orderId: saleData.orderId,
          });
        }

        logger.info("Venda processada e notificação enfileirada", {
          userId,
          orderId: saleData.orderId,
          shouldNotify: result.shouldNotify,
          newAccumulated: result.newAccumulated,
          taskId,
        });
      } catch (taskError) {
        // Log do erro, mas não falha o webhook
        // A venda já foi processada com sucesso
        logger.error("Erro ao enfileirar notificação", {
          error: taskError,
          userId,
          orderId: saleData.orderId,
        });
      }

      res.status(200).json({
        success: true,
        message: "Webhook processado com sucesso",
        data: {
          saleId: result.sale.id,
          shouldNotify: result.shouldNotify,
          newAccumulated: result.newAccumulated,
        },
      });
    } catch (error) {
      logger.error("Erro ao processar webhook do TikTok", error);
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
