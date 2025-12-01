import * as functions from "firebase-functions/v2";
import { Request, Response } from "express";
import { logger } from "../utils/logger";
import { db } from "../config/firebase.config";
import { COLLECTIONS } from "../config/constants";
import { ValidationError } from "../utils/errors";
import {
  exchangeCodeForToken,
  getShopInfo,
  createOAuthData,
} from "../services/tiktok-oauth.service";
import {
  registerWebhook,
  generateWebhookUrl,
} from "../services/tiktok-webhook.service";
import { Timestamp } from "firebase-admin/firestore";
import { User } from "../models/user.model";
import { TikTokProfile } from "../models/tiktok-profile.model";

/**
 * Valida e recupera state token
 */
async function validateAndGetStateToken(
  state: string
): Promise<{ userId: string; username: string } | null> {
  if (!state) {
    return null;
  }

  try {
    const stateDoc = await db.collection(COLLECTIONS.LOGS).doc(state).get();

    if (!stateDoc.exists) {
      return null;
    }

    const stateData = stateDoc.data();
    if (!stateData) {
      return null;
    }

    // Verifica expiração
    const expiresAt = stateData.expiresAt?.toDate();
    if (expiresAt && expiresAt < new Date()) {
      logger.warn("State token expirado", { state });
      return null;
    }

    // Verifica tipo
    if (stateData.type !== "oauth_state") {
      return null;
    }

    // Remove state token após uso (one-time use)
    await stateDoc.ref.delete();

    return {
      userId: stateData.userId,
      username: stateData.username,
    };
  } catch (error) {
    logger.error("Erro ao validar state token", error);
    return null;
  }
}

/**
 * Atualiza perfil com dados de OAuth
 */
async function updateProfileWithOAuth(
  userId: string,
  username: string,
  oauthData: TikTokProfile["oauth"]
): Promise<void> {
  const userRef = db.collection(COLLECTIONS.USUARIOS).doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new ValidationError("Usuário não encontrado");
  }

  const userData = userDoc.data() as User;
  const profiles: TikTokProfile[] = userData.tiktokProfiles || [];

  // Encontra o perfil
  const profileIndex = profiles.findIndex(
    (p) => p.username.toLowerCase() === username.toLowerCase()
  );

  if (profileIndex === -1) {
    throw new ValidationError(`Perfil @${username} não encontrado`);
  }

  // Atualiza o perfil com dados de OAuth
  profiles[profileIndex] = {
    ...profiles[profileIndex],
    oauth: oauthData,
  };

  // Atualiza no Firestore
  await userRef.update({
    tiktokProfiles: profiles,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Cloud Function HTTP para receber callback OAuth do TikTok Shop
 * GET /oauthCallback?code={code}&state={state}
 */
export const oauthCallback = functions.https.onRequest(
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

      const code = req.query.code as string;
      const state = req.query.state as string;
      const error = req.query.error as string;

      // Verifica se houve erro na autorização
      if (error) {
        logger.warn("Erro na autorização OAuth", { error, state });
        res.redirect(
          `${process.env.FRONTEND_URL || "http://localhost:3000"}/tiktok-profiles?error=${encodeURIComponent(error)}`
        );
        return;
      }

      if (!code || !state) {
        throw new ValidationError(
          "Código de autorização ou state não fornecido"
        );
      }

      // Valida e recupera state token
      const stateData = await validateAndGetStateToken(state);
      if (!stateData) {
        throw new ValidationError("State token inválido ou expirado");
      }

      const { userId, username } = stateData;

      // Verifica credenciais do TikTok
      const clientKey = process.env.TIKTOK_CLIENT_KEY;
      const clientSecret =
        process.env.TIKTOK_CLIENT_SECRET || process.env.TIKTOK_APP_SECRET;

      if (!clientKey || !clientSecret) {
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

      // Troca código por token
      logger.info("Trocando código por token", { userId, username });
      const tokenResponse = await exchangeCodeForToken(
        clientKey,
        clientSecret,
        code,
        redirectUri
      );

      // Obtém informações da loja
      logger.info("Obtendo informações da loja", { userId, username });
      const shopInfo = await getShopInfo(tokenResponse.access_token);

      // Cria dados de OAuth criptografados
      const oauthData = createOAuthData(tokenResponse, shopInfo.shop_id);

      // Registra webhook automaticamente
      try {
        logger.info("Registrando webhook", {
          userId,
          username,
          shopId: shopInfo.shop_id,
        });
        const webhookUrl = generateWebhookUrl();
        const webhookResponse = await registerWebhook(
          tokenResponse.access_token,
          webhookUrl,
          ["order.status.update", "order.shipment.update"]
        );

        // Adiciona webhookId aos dados de OAuth
        oauthData.webhookId = webhookResponse.webhook_id;
        logger.info("Webhook registrado com sucesso", {
          userId,
          username,
          webhookId: webhookResponse.webhook_id,
        });
      } catch (webhookError) {
        logger.error("Erro ao registrar webhook, mas continua com OAuth", {
          userId,
          username,
          error: webhookError,
        });
        // Não falha o OAuth se o webhook falhar, apenas loga o erro
      }

      // Atualiza perfil com dados de OAuth
      await updateProfileWithOAuth(userId, username, oauthData);

      logger.info("OAuth concluído com sucesso", {
        userId,
        username,
        shopId: shopInfo.shop_id,
      });

      // Redireciona para frontend com sucesso
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      res.redirect(
        `${frontendUrl}/tiktok-profiles?connected=true&username=${encodeURIComponent(username)}`
      );
    } catch (error) {
      logger.error("Erro no callback OAuth", error);
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

      // Redireciona para frontend com erro
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      res.redirect(
        `${frontendUrl}/tiktok-profiles?error=${encodeURIComponent(errorMessage)}`
      );
    }
  }
);
