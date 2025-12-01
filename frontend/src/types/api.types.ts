/**
 * Resposta de sucesso da API
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Resposta de erro da API
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: unknown;
}

/**
 * Tipo de resposta da API
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;
