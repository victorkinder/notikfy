/**
 * Constantes da aplicação
 */

// Collections do Firestore
export const COLLECTIONS = {
  USUARIOS: "usuarios",
  VENDAS: "vendas",
  LOGS: "logs",
} as const;

// Status de vendas
export const SALE_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  REFUNDED: "refunded",
} as const;

// Mensagens de erro
export const ERROR_MESSAGES = {
  INVALID_REQUEST: "Requisição inválida",
  UNAUTHORIZED: "Não autorizado",
  FORBIDDEN: "Acesso negado",
  NOT_FOUND: "Recurso não encontrado",
  INTERNAL_ERROR: "Erro interno do servidor",
  VALIDATION_FAILED: "Validação falhou",
} as const;

// Mensagens de sucesso
export const SUCCESS_MESSAGES = {
  CREATED: "Recurso criado com sucesso",
  UPDATED: "Recurso atualizado com sucesso",
  DELETED: "Recurso deletado com sucesso",
} as const;

// Limites e configurações
export const LIMITS = {
  MAX_RETRY_ATTEMPTS: 3,
  TELEGRAM_RATE_LIMIT: 30, // mensagens por segundo
} as const;

// Timeouts
export const TIMEOUTS = {
  HTTP_REQUEST: 5000, // 5 segundos
  WEBHOOK_PROCESSING: 10000, // 10 segundos
} as const;
