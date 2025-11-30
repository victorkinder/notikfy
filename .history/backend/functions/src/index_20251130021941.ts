import * as functions from "firebase-functions/v2";
import { Request, Response } from "express";
import { logger } from "./utils/logger";
import { formatError } from "./utils/errors";
import { SUCCESS_MESSAGES } from "./config/constants";

/**
 * Webhook GET que retorna hello world
 */
export const helloWorldGet = functions.https.onRequest(
  {
    cors: true,
  },
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Aceitar apenas método GET
      if (req.method !== "GET") {
        res.status(405).json({
          success: false,
          error: "Method Not Allowed",
          message: "Este endpoint aceita apenas requisições GET",
        });
        return;
      }

      logger.info("Hello World GET webhook called", {
        method: req.method,
        path: req.path,
      });

      res.status(200).json({
        success: true,
        message: "hello world",
      });
    } catch (error) {
      logger.error("Hello World GET webhook error", error);
      const errorResponse = formatError(error);
      res.status(500).json(errorResponse);
    }
  }
);

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
      logger.info("Health check requested", { timestamp: new Date().toISOString() });

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

/**
 * Exemplo de função HTTP que retorna uma mensagem de sucesso
 * Pode ser removida ou adaptada conforme necessário
 */
export const helloWorld = functions.https.onRequest(
  {
    cors: true,
  },
  async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info("Hello World endpoint called", {
        method: req.method,
        path: req.path,
      });

      res.status(200).json({
        success: true,
        message: SUCCESS_MESSAGES.CREATED,
        data: {
          greeting: "Hello from Notikfy Backend!",
        },
      });
    } catch (error) {
      logger.error("Hello World endpoint error", error);
      const errorResponse = formatError(error);
      res.status(500).json(errorResponse);
    }
  }
);

