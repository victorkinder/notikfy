import * as functions from "firebase-functions/v2";
import { Request, Response } from "express";
import { logger } from "../utils/logger";
import { formatError } from "../utils/errors";
import { auth } from "../config/firebase.config";
import { UnauthorizedError, ValidationError } from "../utils/errors";
import { generateAuthUrl } from "../services/tiktok-oauth.service";
import { getUserTikTokProfiles } from "../services/tiktok-profile.service";
import * as crypto from "crypto";
import { db } from "../config/firebase.config";
import { COLLECTIONS } from "../config/constants";
import { Timestamp } from "firebase-admin/firestore";

/**
 * Valida o token de autenticação do Firebase
 * Aceita token via header Authorization ou query parameter (para redirecionamentos)
 */
async function validateAuthToken(req: Request): Promise<{
  uid: string;
  email: string;
}> {
  // Tenta obter token do header primeiro, depois do query parameter
  const authHeader = req.headers.authorization;
  const queryToken = req.query.token as string;

  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split("Bearer ")[1]
    : queryToken;

  if (!token) {
    throw new UnauthorizedError("Token de autenticação não fornecido");
  }

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
 * Gera e armazena state token para validação CSRF
 */
async function generateAndStoreStateToken(
  userId: string,
  username: string
): Promise<string> {
  const stateToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)); // 10 minutos

  // Armazena state token no Firestore
  await db.collection(COLLECTIONS.LOGS).doc(stateToken).set({
    userId,
    username,
    type: "oauth_state",
    expiresAt,
    createdAt: Timestamp.now(),
  });

  return stateToken;
}

/**
 * Cloud Function HTTP para iniciar fluxo OAuth do TikTok Shop
 * GET /initiateOAuth?username={username}
 * Headers: Authorization: Bearer <firebase-id-token>
 */
export const initiateOAuth = functions.https.onRequest(
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
      const { uid, email } = await validateAuthToken(req);

      // Obtém username do query parameter
      const username = req.query.username as string;
      if (!username || !username.trim()) {
        throw new ValidationError("Username é obrigatório");
      }

      const normalizedUsername = username
        .trim()
        .toLowerCase()
        .replace(/^@/, "");

      // Valida que o perfil existe e pertence ao usuário
      const profilesResponse = await getUserTikTokProfiles(uid, email);
      const profile = profilesResponse.profiles.find(
        (p) => p.username.toLowerCase() === normalizedUsername
      );

      if (!profile) {
        throw new ValidationError(
          `Perfil @${normalizedUsername} não encontrado`
        );
      }

      // Verifica credenciais do TikTok
      const clientKey = process.env.TIKTOK_CLIENT_KEY;
      const clientSecret =
        process.env.TIKTOK_CLIENT_SECRET || process.env.TIKTOK_APP_SECRET;

      if (!clientKey || !clientSecret) {
        logger.error("Credenciais do TikTok não configuradas");
        throw new ValidationError(
          "Configuração do TikTok não encontrada. Contate o suporte."
        );
      }

      // Gera redirect URI
      const projectId =
        process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;
      const region = process.env.FUNCTION_REGION || "us-central1";

      if (!projectId) {
        throw new ValidationError(
          "Configuração do projeto não encontrada. Contate o suporte."
        );
      }

      const redirectUri = `https://${region}-${projectId}.cloudfunctions.net/oauthCallback`;

      // Gera e armazena state token
      const stateToken = await generateAndStoreStateToken(
        uid,
        normalizedUsername
      );

      // Gera URL de autorização
      const authUrl = generateAuthUrl(clientKey, redirectUri, stateToken);

      logger.info("Iniciando OAuth do TikTok", {
        userId: uid,
        username: normalizedUsername,
      });

      // Redireciona para página de autorização do TikTok
      res.redirect(authUrl);
    } catch (error) {
      logger.error("Erro ao iniciar OAuth", error);
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
