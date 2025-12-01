import * as functions from "firebase-functions/v2";
import { Request, Response } from "express";
import { logger } from "../utils/logger";
import { formatError } from "../utils/errors";
import { auth } from "../config/firebase.config";
import {
  findSignatureByToken,
  isSignatureValid,
} from "../services/signature.service";
import { Signature } from "../models/signature.model";
import { UnauthorizedError, ValidationError } from "../utils/errors";

/**
 * Valida o token de autenticação do Firebase
 */
async function validateGoogleToken(
  idToken: string
): Promise<{ uid: string; email: string }> {
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email || "",
    };
  } catch (error) {
    logger.warn("Token do Google inválido", { error });
    throw new UnauthorizedError("Token do Google inválido");
  }
}

/**
 * Requisição para validar access_token
 */
interface ValidateAccessTokenRequest {
  accessToken: string;
  idToken: string; // Token do Google
}

/**
 * Resposta de validação
 */
interface ValidateAccessTokenResponse {
  valid: boolean;
  signature?: Signature;
  message?: string;
}

/**
 * Cloud Function HTTP para validar access_token
 * POST /validateAccessToken
 * Body: { accessToken: string, idToken: string }
 */
export const validateAccessToken = functions.https.onRequest(
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

      const { accessToken, idToken } = req.body as ValidateAccessTokenRequest;

      if (
        !accessToken ||
        typeof accessToken !== "string" ||
        !accessToken.trim()
      ) {
        throw new ValidationError("Access token é obrigatório");
      }

      if (!idToken || typeof idToken !== "string" || !idToken.trim()) {
        throw new ValidationError("ID token do Google é obrigatório");
      }

      // Valida token do Google primeiro
      const googleUser = await validateGoogleToken(idToken);

      if (!googleUser.email) {
        throw new ValidationError("Email não encontrado no token do Google");
      }

      // Busca assinatura pelo access_token
      const signature = await findSignatureByToken(accessToken.trim());

      if (!signature) {
        logger.warn("Access token não encontrado", {
          email: googleUser.email,
        });
        res.status(200).json({
          success: true,
          data: {
            valid: false,
            message: "Access token inválido",
          } as ValidateAccessTokenResponse,
        });
        return;
      }

      // Verifica se o email da assinatura corresponde ao email do Google
      if (signature.email.toLowerCase() !== googleUser.email.toLowerCase()) {
        logger.warn("Email da assinatura não corresponde ao email do Google", {
          signatureEmail: signature.email,
          googleEmail: googleUser.email,
        });
        res.status(200).json({
          success: true,
          data: {
            valid: false,
            message: "Access token não corresponde a este usuário",
          } as ValidateAccessTokenResponse,
        });
        return;
      }

      // Verifica se a assinatura está válida (ativa e não expirada)
      const isValid = await isSignatureValid(signature.email);

      if (!isValid) {
        logger.warn("Assinatura inválida ou expirada", {
          email: signature.email,
          status: signature.status,
        });
        res.status(200).json({
          success: true,
          data: {
            valid: false,
            message: "Assinatura inválida ou expirada",
          } as ValidateAccessTokenResponse,
        });
        return;
      }

      logger.info("Access token validado com sucesso", {
        email: signature.email,
        planId: signature.plan.id,
      });

      res.status(200).json({
        success: true,
        data: {
          valid: true,
          signature,
        } as ValidateAccessTokenResponse,
      });
    } catch (error) {
      logger.error("Erro ao validar access token", error);
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
