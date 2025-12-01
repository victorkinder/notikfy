import * as functions from "firebase-functions/v2";
import { Request, Response } from "express";
import { logger } from "../utils/logger";
import { formatError } from "../utils/errors";
import { ValidationError } from "../utils/errors";
import {
  sendSaleNotification,
  sendAccumulatedCommissionNotification,
} from "../services/notification.service";
import {
  NotificationPayload,
  SaleNotificationPayload,
  AccumulatedCommissionNotificationPayload,
} from "../services/taskQueue.service";

/**
 * Valida se a requisição vem do Cloud Tasks
 * Verifica header X-CloudTasks-QueueName que é adicionado automaticamente pelo Cloud Tasks
 */
function validateCloudTaskRequest(req: Request): void {
  const queueName = req.headers["x-cloudtasks-queuename"] as string;
  const taskName = req.headers["x-cloudtasks-taskname"] as string;

  // Em desenvolvimento/emulador, pode não ter esses headers
  // Em produção, Cloud Tasks sempre adiciona esses headers
  if (!queueName && process.env.NODE_ENV === "production") {
    logger.warn("Requisição sem header do Cloud Tasks", {
      headers: req.headers,
    });
  }

  logger.debug("Processando tarefa do Cloud Tasks", {
    queueName,
    taskName,
  });
}

/**
 * Valida payload de notificação
 */
function validateNotificationPayload(body: unknown): NotificationPayload {
  if (!body || typeof body !== "object") {
    throw new ValidationError("Payload inválido");
  }

  const payload = body as Record<string, unknown>;

  if (!payload.type || typeof payload.type !== "string") {
    throw new ValidationError("Tipo de notificação é obrigatório");
  }

  if (payload.type !== "sale" && payload.type !== "accumulated_commission") {
    throw new ValidationError(
      "Tipo de notificação deve ser 'sale' ou 'accumulated_commission'"
    );
  }

  if (!payload.userId || typeof payload.userId !== "string") {
    throw new ValidationError("userId é obrigatório");
  }

  if (payload.type === "sale") {
    if (!payload.saleData || typeof payload.saleData !== "object") {
      throw new ValidationError(
        "saleData é obrigatório para notificação de venda"
      );
    }

    const saleData = payload.saleData as {
      productName: string;
      amount: number;
      currency: string;
      orderId: string;
    };

    if (
      typeof saleData.productName !== "string" ||
      typeof saleData.amount !== "number" ||
      typeof saleData.currency !== "string" ||
      typeof saleData.orderId !== "string"
    ) {
      throw new ValidationError(
        "saleData deve conter productName, amount, currency e orderId válidos"
      );
    }

    const salePayload: SaleNotificationPayload = {
      type: "sale",
      userId: payload.userId,
      saleData,
    };
    return salePayload;
  }

  if (payload.type === "accumulated_commission") {
    if (
      typeof payload.accumulatedAmount !== "number" ||
      typeof payload.threshold !== "number"
    ) {
      throw new ValidationError(
        "accumulatedAmount e threshold são obrigatórios para notificação de comissão acumulada"
      );
    }

    const commissionPayload: AccumulatedCommissionNotificationPayload = {
      type: "accumulated_commission",
      userId: payload.userId,
      accumulatedAmount: payload.accumulatedAmount,
      threshold: payload.threshold,
    };
    return commissionPayload;
  }

  throw new ValidationError("Tipo de notificação inválido");
}

/**
 * Cloud Function HTTP para processar notificações enfileiradas pelo Cloud Tasks
 * Esta função é chamada pelo Cloud Tasks após enfileirar uma notificação
 */
export const processNotificationTask = functions.https.onRequest(
  {
    cors: true,
    timeoutSeconds: 60,
    memory: "256MiB",
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

      // Valida se vem do Cloud Tasks (opcional, mas recomendado)
      validateCloudTaskRequest(req);

      // Valida e parseia payload
      let payload: NotificationPayload;
      try {
        // Cloud Tasks envia o body como base64 quando configurado assim
        let body = req.body;
        if (typeof body === "string") {
          try {
            body = JSON.parse(body);
          } catch {
            // Se não for JSON válido, tenta decodificar base64
            body = JSON.parse(Buffer.from(body, "base64").toString("utf-8"));
          }
        }
        payload = validateNotificationPayload(body);
      } catch (error) {
        logger.error("Erro ao validar payload", error);
        throw new ValidationError(
          `Payload inválido: ${error instanceof Error ? error.message : String(error)}`
        );
      }

      logger.info("Processando notificação enfileirada", {
        type: payload.type,
        userId: payload.userId,
      });

      // Processa notificação conforme tipo
      if (payload.type === "sale") {
        await sendSaleNotification(payload.userId, payload.saleData);
      } else if (payload.type === "accumulated_commission") {
        await sendAccumulatedCommissionNotification(
          payload.userId,
          payload.accumulatedAmount,
          payload.threshold
        );
      }

      logger.info("Notificação processada com sucesso", {
        type: payload.type,
        userId: payload.userId,
      });

      res.status(200).json({
        success: true,
        message: "Notificação processada com sucesso",
      });
    } catch (error) {
      logger.error("Erro ao processar notificação enfileirada", error);
      const errorResponse = formatError(error);
      const statusCode = error instanceof ValidationError ? 400 : 500;
      res.status(statusCode).json(errorResponse);
    }
  }
);
