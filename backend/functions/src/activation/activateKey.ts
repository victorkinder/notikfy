import * as functions from "firebase-functions/v2";
import { Request, Response } from "express";
import { logger } from "../utils/logger";
import { formatError } from "../utils/errors";
import { validateAndActivateKey } from "../services/activation.service";
import { ActivationRequest } from "../models/activation.model";
import { UnauthorizedError, ValidationError } from "../utils/errors";
import { auth } from "../config/firebase.config";

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
 * Cloud Function HTTP para ativar uma chave de ativação
 * POST /activateKey
 * Headers: Authorization: Bearer <firebase-id-token>
 * Body: { key: string }
 */
export const activateKey = functions.https.onRequest(
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

      const { key } = req.body as ActivationRequest;

      if (!key || typeof key !== "string" || !key.trim()) {
        throw new ValidationError("Chave de ativação é obrigatória");
      }

      logger.info("Tentativa de ativação de chave", { userId, key });

      // Valida e ativa a chave
      const activationData = await validateAndActivateKey(key.trim(), userId);

      logger.info("Chave ativada com sucesso", {
        userId,
        key,
        planId: activationData.planId,
      });

      res.status(200).json({
        success: true,
        message: "Chave ativada com sucesso",
        data: activationData,
      });
    } catch (error) {
      logger.error("Erro ao ativar chave", error);
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
