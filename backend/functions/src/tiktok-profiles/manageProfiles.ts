import * as functions from "firebase-functions/v2";
import { Request, Response } from "express";
import { logger } from "../utils/logger";
import { formatError } from "../utils/errors";
import { auth } from "../config/firebase.config";
import {
  getUserTikTokProfiles as getUserTikTokProfilesService,
  addTikTokProfile as addTikTokProfileService,
  removeTikTokProfile as removeTikTokProfileService,
} from "../services/tiktok-profile.service";
import { UnauthorizedError, ValidationError } from "../utils/errors";
import { findUserIdByAccessToken } from "../services/signature.service";

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
 * Requisição para adicionar perfil TikTok
 */
interface AddTikTokProfileRequest {
  username: string;
}

/**
 * Requisição para remover perfil TikTok
 */
interface RemoveTikTokProfileRequest {
  username: string;
}

/**
 * Cloud Function HTTP para listar perfis do TikTok do usuário
 * GET /getTikTokProfiles
 * Headers: Authorization: Bearer <firebase-id-token>
 */
export const getTikTokProfiles = functions.https.onRequest(
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

      // Obtém accessToken da ativação (header opcional ou query param)
      const headerToken = req.headers["x-activation-token"];
      const queryToken = req.query.accessToken;
      const activationAccessToken: string | null =
        (Array.isArray(headerToken) ? headerToken[0] : headerToken) ||
        (typeof queryToken === "string" ? queryToken : null) ||
        null;

      // Se activationAccessToken for fornecido, valida que pertence ao userId correto
      if (activationAccessToken) {
        const tokenUserId = await findUserIdByAccessToken(
          activationAccessToken
        );
        if (tokenUserId && tokenUserId !== uid) {
          logger.warn("Tentativa de usar activation token de outro usuário", {
            userId: uid,
            tokenUserId,
            activationAccessToken,
          });
          throw new ValidationError(
            "Este token de ativação pertence a outro usuário"
          );
        }
      }

      logger.info("Listando perfis TikTok", {
        userId: uid,
        hasActivationToken: !!activationAccessToken,
      });

      // Obtém perfis do usuário
      const profilesResponse = await getUserTikTokProfilesService(
        uid,
        email,
        activationAccessToken || undefined
      );

      res.status(200).json({
        success: true,
        data: profilesResponse,
      });
    } catch (error) {
      logger.error("Erro ao listar perfis TikTok", error);
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

/**
 * Cloud Function HTTP para adicionar perfil do TikTok
 * POST /addTikTokProfile
 * Headers: Authorization: Bearer <firebase-id-token>
 * Body: { username: string }
 */
export const addTikTokProfile = functions.https.onRequest(
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
      const { uid, email } = await validateAuthToken(req);

      // Obtém accessToken da ativação (header opcional ou query param)
      const headerToken = req.headers["x-activation-token"];
      const queryToken = req.query.accessToken;
      const activationAccessToken: string | null =
        (Array.isArray(headerToken) ? headerToken[0] : headerToken) ||
        (typeof queryToken === "string" ? queryToken : null) ||
        null;

      // Se activationAccessToken for fornecido, valida que pertence ao userId correto
      if (activationAccessToken) {
        const tokenUserId = await findUserIdByAccessToken(
          activationAccessToken
        );
        if (tokenUserId && tokenUserId !== uid) {
          logger.warn("Tentativa de usar activation token de outro usuário", {
            userId: uid,
            tokenUserId,
            activationAccessToken,
          });
          throw new ValidationError(
            "Este token de ativação pertence a outro usuário"
          );
        }
      }

      // Valida body
      if (!req.body || typeof req.body !== "object") {
        throw new ValidationError("Corpo da requisição inválido");
      }

      const { username } = req.body as AddTikTokProfileRequest;

      if (!username || typeof username !== "string" || !username.trim()) {
        throw new ValidationError("Username é obrigatório");
      }

      logger.info("Adicionando perfil TikTok", {
        userId: uid,
        username: username.trim(),
        hasActivationToken: !!activationAccessToken,
      });

      // Adiciona perfil
      const newProfile = await addTikTokProfileService(
        uid,
        email,
        username.trim(),
        activationAccessToken || undefined
      );

      res.status(200).json({
        success: true,
        message: "Perfil adicionado com sucesso",
        data: newProfile,
      });
    } catch (error) {
      logger.error("Erro ao adicionar perfil TikTok", error);
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

/**
 * Cloud Function HTTP para remover perfil do TikTok
 * DELETE /removeTikTokProfile
 * Headers: Authorization: Bearer <firebase-id-token>
 * Body: { username: string }
 */
export const removeTikTokProfile = functions.https.onRequest(
  {
    cors: true,
  },
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Apenas aceita DELETE ou POST (para compatibilidade)
      if (req.method !== "DELETE" && req.method !== "POST") {
        res.status(405).json({
          success: false,
          error: "MethodNotAllowed",
          message: "Método não permitido. Use DELETE ou POST.",
        });
        return;
      }

      // Valida autenticação
      const { uid } = await validateAuthToken(req);

      // Valida body
      if (!req.body || typeof req.body !== "object") {
        throw new ValidationError("Corpo da requisição inválido");
      }

      const { username } = req.body as RemoveTikTokProfileRequest;

      if (!username || typeof username !== "string" || !username.trim()) {
        throw new ValidationError("Username é obrigatório");
      }

      logger.info("Removendo perfil TikTok", {
        userId: uid,
        username: username.trim(),
      });

      // Remove perfil
      await removeTikTokProfileService(uid, username.trim());

      res.status(200).json({
        success: true,
        message: "Perfil removido com sucesso",
      });
    } catch (error) {
      logger.error("Erro ao remover perfil TikTok", error);
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
