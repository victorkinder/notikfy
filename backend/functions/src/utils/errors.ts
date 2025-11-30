import { ERROR_MESSAGES } from "../config/constants";

/**
 * Classe base para erros customizados da aplicação
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Erro de validação (400)
 */
export class ValidationError extends AppError {
  constructor(message: string = ERROR_MESSAGES.VALIDATION_FAILED) {
    super(message, 400);
    this.name = "ValidationError";
  }
}

/**
 * Erro de autenticação (401)
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = ERROR_MESSAGES.UNAUTHORIZED) {
    super(message, 401);
    this.name = "UnauthorizedError";
  }
}

/**
 * Erro de permissão (403)
 */
export class ForbiddenError extends AppError {
  constructor(message: string = ERROR_MESSAGES.FORBIDDEN) {
    super(message, 403);
    this.name = "ForbiddenError";
  }
}

/**
 * Erro de recurso não encontrado (404)
 */
export class NotFoundError extends AppError {
  constructor(message: string = ERROR_MESSAGES.NOT_FOUND) {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

/**
 * Erro interno do servidor (500)
 */
export class InternalServerError extends AppError {
  constructor(message: string = ERROR_MESSAGES.INTERNAL_ERROR) {
    super(message, 500);
    this.name = "InternalServerError";
  }
}

/**
 * Formata erro para resposta HTTP
 */
export function formatError(error: unknown): {
  success: false;
  error: string;
  message: string;
  details?: unknown;
} {
  if (error instanceof AppError) {
    return {
      success: false,
      error: error.name,
      message: error.message,
    };
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: "InternalServerError",
      message: error.message,
    };
  }

  return {
    success: false,
    error: "InternalServerError",
    message: ERROR_MESSAGES.INTERNAL_ERROR,
    details: error,
  };
}
