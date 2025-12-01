import * as functions from "firebase-functions/v2";
import { Request, Response } from "express";
import { logger } from "../utils/logger";
import { formatError } from "../utils/errors";
import { createActivationKeyForPlan } from "../services/activation.service";
import { PurchasePlanRequest, PlanId, PLANS } from "../models/activation.model";
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
 * Cloud Function HTTP para comprar um plano
 * POST /purchasePlan
 * Headers: Authorization: Bearer <firebase-id-token>
 * Body: { planId: 'STARTER' | 'SCALING' | 'SCALED' }
 */
export const purchasePlan = functions.https.onRequest(
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

      const { planId } = req.body as PurchasePlanRequest;

      if (!planId || typeof planId !== "string") {
        throw new ValidationError("ID do plano é obrigatório");
      }

      // Valida se o plano existe
      if (!PLANS[planId as PlanId]) {
        throw new ValidationError(
          `Plano inválido. Planos disponíveis: ${Object.keys(PLANS).join(", ")}`
        );
      }

      logger.info("Tentativa de compra de plano", { userId, planId });

      // TODO: Aqui seria integrado com gateway de pagamento (Stripe, PayPal, etc.)
      // Por enquanto, apenas gera a chave de ativação
      const activationData = await createActivationKeyForPlan(planId as PlanId);

      logger.info("Plano comprado e chave gerada com sucesso", {
        userId,
        planId,
        key: activationData.key,
      });

      res.status(200).json({
        success: true,
        message: "Plano comprado com sucesso. Chave de ativação gerada.",
        data: activationData,
      });
    } catch (error) {
      logger.error("Erro ao comprar plano", error);
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
