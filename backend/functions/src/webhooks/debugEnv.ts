import * as functions from "firebase-functions/v2";
import { Request, Response } from "express";
import { logger } from "../utils/logger";
import { KIWIFY } from "../config/constants";

/**
 * Endpoint temporário de debug para verificar variáveis de ambiente
 * Remover após identificar o problema
 */
export const debugEnv = functions.https.onRequest(
  {
    cors: true,
  },
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const envInfo = {
        hasKIWIFY_SECRET_KEY: !!process.env.KIWIFY_SECRET_KEY,
        hasKIWIFY_WEBHOOK_TOKEN: !!process.env.KIWIFY_WEBHOOK_TOKEN,
        KIWIFY_SECRET_KEY_length: process.env.KIWIFY_SECRET_KEY?.length || 0,
        KIWIFY_WEBHOOK_TOKEN_length:
          process.env.KIWIFY_WEBHOOK_TOKEN?.length || 0,
        KIWIFY_SECRET_KEY_preview: process.env.KIWIFY_SECRET_KEY
          ? process.env.KIWIFY_SECRET_KEY.substring(0, 5) + "..."
          : "undefined",
        KIWIFY_WEBHOOK_TOKEN_preview: process.env.KIWIFY_WEBHOOK_TOKEN
          ? process.env.KIWIFY_WEBHOOK_TOKEN.substring(0, 5) + "..."
          : "undefined",
        SECRET_KEY_from_constants: KIWIFY.SECRET_KEY
          ? KIWIFY.SECRET_KEY.substring(0, 5) + "..."
          : "undefined",
        SECRET_KEY_length: KIWIFY.SECRET_KEY?.length || 0,
        allKIWIFYEnvVars: Object.keys(process.env).filter((key) =>
          key.includes("KIWIFY")
        ),
        nodeEnv: process.env.NODE_ENV,
        functionName: process.env.FUNCTION_NAME,
        functionTarget: process.env.FUNCTION_TARGET,
        kFunctionServiceAccount: process.env.K_SERVICE,
        kFunctionRevision: process.env.K_REVISION,
      };

      logger.info("DEBUG - Variáveis de ambiente verificadas", envInfo);

      res.status(200).json({
        success: true,
        debug: envInfo,
        message:
          "Verifique os logs para mais detalhes. Este endpoint deve ser removido após identificar o problema.",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("DEBUG - Erro ao verificar variáveis", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }
);
