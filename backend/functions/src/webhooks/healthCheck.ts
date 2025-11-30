import * as functions from "firebase-functions/v2";
import { Request, Response } from "express";
import { logger } from "../utils/logger";
import { formatError } from "../utils/errors";

/**
 * Health check endpoint
 * Útil para verificar se as functions estão rodando corretamente
 */
export const healthCheck = functions.https.onRequest(
  {
    cors: true,
  },
  async (_req: Request, res: Response): Promise<void> => {
    try {
      logger.info("Health check requested", {
        timestamp: new Date().toISOString(),
      });

      res.status(200).json({
        success: true,
        message: "Service is healthy",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
      });
    } catch (error) {
      logger.error("Health check failed", error);
      const errorResponse = formatError(error);
      res.status(500).json(errorResponse);
    }
  }
);
