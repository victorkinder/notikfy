import * as functions from "firebase-functions/v2";
import { Request, Response } from "express";
import { logger } from "../utils/logger";
import { formatError } from "../utils/errors";
import { SUCCESS_MESSAGES } from "../config/constants";

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
