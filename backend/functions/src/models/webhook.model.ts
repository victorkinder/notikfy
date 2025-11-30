/**
 * Payload genérico de webhook
 */
export interface WebhookPayload {
  [key: string]: unknown;
}

/**
 * Estrutura esperada de um webhook do TikTok (exemplo)
 * Ajustar conforme documentação oficial do TikTok
 */
export interface TikTokWebhookPayload {
  event_type?: string;
  order_id?: string;
  product_name?: string;
  amount?: number;
  currency?: string;
  status?: string;
  timestamp?: string;
  [key: string]: unknown;
}

/**
 * Headers do webhook para validação
 */
export interface WebhookHeaders {
  signature?: string;
  "x-tiktok-signature"?: string;
  "x-signature"?: string;
  [key: string]: unknown;
}

/**
 * Dados de validação de webhook
 */
export interface WebhookValidationData {
  payload: WebhookPayload;
  signature: string;
  secret: string;
}

/**
 * Resultado do processamento de webhook
 */
export interface WebhookProcessResult {
  success: boolean;
  message?: string;
  data?: unknown;
  error?: string;
}
