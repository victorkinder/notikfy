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

/**
 * Interface para payload de webhook de venda
 * Ajustar conforme estrutura real do webhook
 */
interface SaleWebhookPayload {
  orderId: string;
  productName?: string;
  amount?: number;
  currency?: string;
  userId?: string; // Pode vir no webhook ou ser determinado por outro campo
  status?: string;
  [key: string]: unknown; // Permite campos extras
}

/**
 * Valida autenticação do webhook (ajustar conforme necessário)
 * Pode usar HMAC, token, ou outro método de validação
 */
function validateWebhookAuth(req: Request): void {
  // TODO: Implementar validação conforme método de autenticação do webhook
  // Exemplo: validação HMAC, token no header, etc.
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    // Se não houver header de autorização, pode ser que o webhook use outro método
    // Por enquanto, apenas loga warning
    logger.warn("Webhook sem header de autorização", {
      headers: req.headers,
    });
  }
}

/**
 * Extrai userId do payload ou headers
 * Ajustar conforme estrutura real do webhook
 */
function extractUserId(payload: SaleWebhookPayload, req: Request): string {
  // Tenta extrair do payload
  if (payload.userId && typeof payload.userId === "string") {
    return payload.userId;
  }

  // Tenta extrair de headers customizados
  const userIdHeader = req.headers["x-user-id"] as string;
  if (userIdHeader) {
    return userIdHeader;
  }

  throw new ValidationError(
    "ID do usuário não encontrado no payload ou headers. Forneça 'userId' no payload ou 'x-user-id' no header."
  );
}

/**
 * Cloud Function HTTP para receber webhooks de vendas
 * POST /saleWebhook
 * Body: { orderId, productName, amount, currency, userId?, ... }
 */
export const saleWebhook = functions.https.onRequest(
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

      // Valida autenticação (ajustar conforme necessário)
      validateWebhookAuth(req);

      const payload = req.body as SaleWebhookPayload;

      if (!payload.orderId) {
        throw new ValidationError("orderId é obrigatório no payload");
      }

      // Extrai userId
      const userId = extractUserId(payload, req);

      // Extrai comissão do webhook
      const commission = extractCommissionFromWebhook(payload);

      // Prepara dados da venda
      const saleData: CreateSaleData = {
        userId,
        orderId: payload.orderId,
        productName: payload.productName || "Produto não especificado",
        amount: payload.amount || 0,
        currency: payload.currency || "BRL",
        status:
          payload.status === "pending"
            ? "pending"
            : payload.status === "refunded"
              ? "refunded"
              : "completed",
        commission,
        webhookData: payload,
        notificationSent: false,
      };

      logger.info("Webhook de venda recebido", {
        userId,
        orderId: payload.orderId,
        commission,
      });

      // Processa venda com lógica de comissão acumulada
      const result = await processSaleWithAccumulatedCommission(
        userId,
        saleData,
        commission
      );

      // Enfileira notificações para processamento assíncrono
      // Isso permite que o webhook responda imediatamente após salvar os dados
      // sem bloquear na chamada da API do Telegram
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
          orderId: payload.orderId,
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
          orderId: payload.orderId,
        });
      }

      res.status(200).json({
        success: true,
        message: "Venda processada com sucesso",
        data: {
          saleId: result.sale.id,
          shouldNotify: result.shouldNotify,
          newAccumulated: result.newAccumulated,
        },
      });
    } catch (error) {
      logger.error("Erro ao processar webhook de venda", error);
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
