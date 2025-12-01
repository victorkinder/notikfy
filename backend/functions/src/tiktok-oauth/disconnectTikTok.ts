import * as functions from "firebase-functions/v2";
import { Request, Response } from "express";
import { logger } from "../utils/logger";
import { formatError } from "../utils/errors";
import { auth } from "../config/firebase.config";
import {
  UnauthorizedError,
  ValidationError,
  NotFoundError,
} from "../utils/errors";
import { db } from "../config/firebase.config";
import { COLLECTIONS } from "../config/constants";
import { Timestamp } from "firebase-admin/firestore";
import { User } from "../models/user.model";
import { TikTokProfile } from "../models/tiktok-profile.model";
import { getDecryptedAccessToken } from "../services/tiktok-oauth.service";
import { unregisterWebhook } from "../services/tiktok-webhook.service";

/**
 * Valida o token de autenticação do Firebase
 */
async function validateAuthToken(req: Request): Promise<{
  uid: string;
  email: string;
}> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError("Token de autenticação não fornecido");
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await auth.verifyIdToken(token);
    if (!decodedToken.email) {
      throw new UnauthorizedError("Email não encontrado no token");
    }
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };
  } catch (error) {
    logger.warn("Token de autenticação inválido", { error });
    throw new UnauthorizedError("Token de autenticação inválido");
  }
}

/**
 * Cloud Function HTTP para desconectar perfil TikTok
 * POST /disconnectTikTok
 * Headers: Authorization: Bearer <firebase-id-token>
 * Body: { username: string }
 */
export const disconnectTikTok = functions.https.onRequest(
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
      const { uid } = await validateAuthToken(req);

      // Valida body
      if (!req.body || typeof req.body !== "object") {
        throw new ValidationError("Corpo da requisição inválido");
      }

      const { username } = req.body as { username: string };

      if (!username || typeof username !== "string" || !username.trim()) {
        throw new ValidationError("Username é obrigatório");
      }

      const normalizedUsername = username
        .trim()
        .toLowerCase()
        .replace(/^@/, "");

      // Busca usuário e perfil
      const userRef = db.collection(COLLECTIONS.USUARIOS).doc(uid);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        throw new NotFoundError("Usuário não encontrado");
      }

      const userData = userDoc.data() as User;
      const profiles: TikTokProfile[] = userData.tiktokProfiles || [];

      // Encontra o perfil
      const profileIndex = profiles.findIndex(
        (p) => p.username.toLowerCase() === normalizedUsername
      );

      if (profileIndex === -1) {
        throw new NotFoundError(`Perfil @${normalizedUsername} não encontrado`);
      }

      const profile = profiles[profileIndex];

      // Verifica se está conectado
      if (!profile.oauth?.isConnected) {
        throw new ValidationError("Perfil não está conectado");
      }

      // Desregistra webhook se existir
      if (profile.oauth.webhookId) {
        try {
          const accessToken = getDecryptedAccessToken(profile);
          if (accessToken) {
            await unregisterWebhook(accessToken, profile.oauth.webhookId);
            logger.info("Webhook desregistrado", {
              userId: uid,
              username: normalizedUsername,
              webhookId: profile.oauth.webhookId,
            });
          }
        } catch (webhookError) {
          logger.error(
            "Erro ao desregistrar webhook, mas continua desconexão",
            {
              userId: uid,
              username: normalizedUsername,
              error: webhookError,
            }
          );
          // Não falha a desconexão se o webhook falhar
        }
      }

      // Remove dados de OAuth do perfil
      const updatedProfiles = [...profiles];
      updatedProfiles[profileIndex] = {
        ...updatedProfiles[profileIndex],
        oauth: undefined,
      };

      // Atualiza no Firestore
      await userRef.update({
        tiktokProfiles: updatedProfiles,
        updatedAt: Timestamp.now(),
      });

      logger.info("Perfil TikTok desconectado com sucesso", {
        userId: uid,
        username: normalizedUsername,
      });

      res.status(200).json({
        success: true,
        message: "Perfil desconectado com sucesso",
      });
    } catch (error) {
      logger.error("Erro ao desconectar perfil TikTok", error);
      const errorResponse = formatError(error);
      const statusCode =
        error instanceof UnauthorizedError
          ? 401
          : error instanceof ValidationError || error instanceof NotFoundError
            ? 400
            : 500;
      res.status(statusCode).json(errorResponse);
    }
  }
);
