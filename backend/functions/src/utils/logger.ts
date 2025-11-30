import * as functions from "firebase-functions";

/**
 * Logger estruturado usando Firebase Functions Logger
 * Fornece métodos para diferentes níveis de log
 */
export const logger = {
  /**
   * Log de informação
   */
  info: (message: string, data?: unknown): void => {
    if (data) {
      functions.logger.info(message, { data });
    } else {
      functions.logger.info(message);
    }
  },

  /**
   * Log de erro
   */
  error: (message: string, error?: unknown): void => {
    if (error) {
      functions.logger.error(message, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    } else {
      functions.logger.error(message);
    }
  },

  /**
   * Log de aviso
   */
  warn: (message: string, data?: unknown): void => {
    if (data) {
      functions.logger.warn(message, { data });
    } else {
      functions.logger.warn(message);
    }
  },

  /**
   * Log de debug
   */
  debug: (message: string, data?: unknown): void => {
    if (data) {
      functions.logger.debug(message, { data });
    } else {
      functions.logger.debug(message);
    }
  },
};
