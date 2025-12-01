/**
 * Serviço para padronização de mensagens e tratamento de erros
 */

/**
 * Mensagens padrão do sistema
 */
export const NOTIFICATION_MESSAGES = {
  SUCCESS: {
    SAVED: "Salvo com sucesso!",
    CREATED: "Criado com sucesso!",
    UPDATED: "Atualizado com sucesso!",
    DELETED: "Removido com sucesso!",
    OPERATION_COMPLETE: "Operação concluída com sucesso!",
  },
  ERROR: {
    GENERIC: "Ocorreu um erro inesperado. Tente novamente.",
    NETWORK: "Erro de conexão. Verifique sua internet.",
    UNAUTHORIZED: "Você não tem permissão para realizar esta ação.",
    NOT_FOUND: "Recurso não encontrado.",
    VALIDATION: "Dados inválidos. Verifique as informações.",
    SERVER_ERROR: "Erro no servidor. Tente novamente mais tarde.",
    TIMEOUT: "A operação demorou muito. Tente novamente.",
  },
  WARNING: {
    CONFIRMATION_REQUIRED: "Confirmação necessária.",
    LIMIT_REACHED: "Limite atingido.",
    UNSAVED_CHANGES: "Há alterações não salvas.",
  },
  INFO: {
    LOADING: "Carregando...",
    PROCESSING: "Processando...",
    WAIT: "Aguarde um momento...",
  },
} as const;

/**
 * Extrai mensagem de erro de diferentes tipos de objetos
 */
export function extractErrorMessage(
  error: string | Error | unknown
): string {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message || NOTIFICATION_MESSAGES.ERROR.GENERIC;
  }

  if (error && typeof error === "object") {
    // Tenta extrair mensagem de objetos de erro da API
    if ("message" in error && typeof error.message === "string") {
      return error.message;
    }

    if ("error" in error && typeof error.error === "string") {
      return error.error;
    }

    // Tenta extrair de resposta de API
    if ("response" in error) {
      const response = (error as { response?: unknown }).response;
      if (
        response &&
        typeof response === "object" &&
        "data" in response
      ) {
        const data = (response as { data?: unknown }).data;
        if (data && typeof data === "object") {
          if ("message" in data && typeof data.message === "string") {
            return data.message;
          }
          if ("error" in data && typeof data.error === "string") {
            return data.error;
          }
        }
      }
    }
  }

  return NOTIFICATION_MESSAGES.ERROR.GENERIC;
}

/**
 * Formata mensagens com interpolação de variáveis
 * Exemplo: formatMessage("Olá {name}!", { name: "João" }) => "Olá João!"
 */
export function formatMessage(
  template: string,
  variables: Record<string, string | number> = {}
): string {
  let formatted = template;

  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, "g");
    formatted = formatted.replace(regex, String(value));
  });

  return formatted;
}

/**
 * Determina se um erro é uma instância de erro de rede
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes("network") ||
      error.message.includes("Network") ||
      error.message.includes("fetch") ||
      error.message.includes("Failed to fetch")
    );
  }
  return false;
}

/**
 * Determina se um erro é de timeout
 */
export function isTimeoutError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes("timeout") ||
      error.message.includes("Timeout") ||
      error.message.includes("aborted")
    );
  }
  return false;
}

/**
 * Trata erros de HTTP e retorna mensagem apropriada
 */
export function getHttpErrorMessage(statusCode?: number): string {
  if (!statusCode) {
    return NOTIFICATION_MESSAGES.ERROR.GENERIC;
  }

  switch (statusCode) {
    case 400:
      return NOTIFICATION_MESSAGES.ERROR.VALIDATION;
    case 401:
      return NOTIFICATION_MESSAGES.ERROR.UNAUTHORIZED;
    case 404:
      return NOTIFICATION_MESSAGES.ERROR.NOT_FOUND;
    case 500:
    case 502:
    case 503:
      return NOTIFICATION_MESSAGES.ERROR.SERVER_ERROR;
    default:
      return NOTIFICATION_MESSAGES.ERROR.GENERIC;
  }
}

