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
import { User } from "../models/user.model";
import { TikTokProfile } from "../models/tiktok-profile.model";

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
 * Cloud Function HTTP para verificar status de conexão de um perfil
 * GET /getConnectionStatus?username={username}
 * Headers: Authorization: Bearer <firebase-id-token>
 */
export const getConnectionStatus = functions.https.onRequest(
  {
    cors: true,
  },
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Apenas aceita GET
      if (req.method !== "GET") {
        res.status(405).json({
          success: false,
          error: "MethodNotAllowed",
          message: "Método não permitido. Use GET.",
        });
        return;
      }

      // Valida autenticação
      const { uid } = await validateAuthToken(req);

      // Obtém username do query parameter
      const username = req.query.username as string;
      if (!username || !username.trim()) {
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
      const profile = profiles.find(
        (p) => p.username.toLowerCase() === normalizedUsername
      );

      if (!profile) {
        throw new NotFoundError(`Perfil @${normalizedUsername} não encontrado`);
      }

      // Retorna status de conexão
      const isConnected = profile.oauth?.isConnected || false;

      res.status(200).json({
        success: true,
        data: {
          username: profile.username,
          isConnected,
          shopId: profile.oauth?.shopId,
          connectedAt: profile.oauth?.connectedAt
            ? profile.oauth.connectedAt.toDate().toISOString()
            : undefined,
        },
      });
    } catch (error) {
      logger.error("Erro ao verificar status de conexão", error);
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
