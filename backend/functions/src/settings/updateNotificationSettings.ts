import * as functions from "firebase-functions/v2";
import { Request, Response } from "express";
import { logger } from "../utils/logger";
import { formatError } from "../utils/errors";
import { auth } from "../config/firebase.config";
import { updateNotificationSettings } from "../services/user.service";
import { UpdateNotificationSettingsData } from "../models/user.model";
import { UnauthorizedError, ValidationError } from "../utils/errors";

/**
 * Valida o token de autenticação do Firebase
 */
async function validateAuthToken(req: Request): Promise<string> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError("Token de autenticação não fornecido");
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken.uid;
  } catch (error) {
    logger.warn("Token de autenticação inválido", { error });
    throw new UnauthorizedError("Token de autenticação inválido");
  }
}

/**
 * Cloud Function HTTP para atualizar configurações de notificação
 * POST /updateNotificationSettings
 * Headers: Authorization: Bearer <firebase-id-token>
 * Body: { type: "sale" | "accumulated_commission", accumulatedCommissionThreshold?: number }
 */
export const updateNotificationSettingsFunction = functions.https.onRequest(
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

      // Valida autenticação
      const userId = await validateAuthToken(req);

      // Valida body
      if (!req.body || typeof req.body !== "object") {
        throw new ValidationError("Corpo da requisição inválido");
      }

      const settings = req.body as UpdateNotificationSettingsData;

      if (!settings.type) {
        throw new ValidationError("Tipo de notificação é obrigatório");
      }

      logger.info("Tentativa de atualizar configurações de notificação", {
        userId,
        type: settings.type,
      });

      // Atualiza as configurações
      const updatedSettings = await updateNotificationSettings(
        userId,
        settings
      );

      logger.info("Configurações de notificação atualizadas com sucesso", {
        userId,
        type: updatedSettings.type,
      });

      res.status(200).json({
        success: true,
        message: "Configurações de notificação atualizadas com sucesso",
        data: updatedSettings,
      });
    } catch (error) {
      logger.error("Erro ao atualizar configurações de notificação", error);
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
