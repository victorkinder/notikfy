import * as crypto from "crypto";
import { logger } from "../utils/logger";
import { ValidationError } from "../utils/errors";

const TIKTOK_API_BASE_URL = "https://open-api.tiktokglobalshop.com";

/**
 * Interface para registro de webhook
 */
interface RegisterWebhookRequest {
  event_type: string[];
  webhook_url: string;
}

/**
 * Interface para resposta de registro de webhook
 */
interface RegisterWebhookResponse {
  webhook_id: string;
  event_type: string[];
  webhook_url: string;
  status?: string;
}

/**
 * Interface para lista de webhooks
 */
interface WebhookListResponse {
  webhooks: Array<{
    webhook_id: string;
    event_type: string[];
    webhook_url: string;
    status: string;
  }>;
}

/**
 * Gera URL do webhook baseado no projeto Firebase
 */
export function generateWebhookUrl(): string {
  const projectId =
    process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;
  const region = process.env.FUNCTION_REGION || "us-central1";

  if (!projectId) {
    throw new Error(
      "FIREBASE_PROJECT_ID ou GCLOUD_PROJECT não configurado nas variáveis de ambiente"
    );
  }

  return `https://${region}-${projectId}.cloudfunctions.net/tiktokWebhook`;
}

/**
 * Registra webhook na API do TikTok Shop
 */
export async function registerWebhook(
  accessToken: string,
  webhookUrl: string,
  eventTypes: string[] = ["order.status.update"]
): Promise<RegisterWebhookResponse> {
  const url = `${TIKTOK_API_BASE_URL}/api/v2/webhook/register`;

  const body: RegisterWebhookRequest = {
    event_type: eventTypes,
    webhook_url: webhookUrl,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("Erro ao registrar webhook", {
        status: response.status,
        error: errorText,
        webhookUrl,
      });
      throw new ValidationError(
        `Falha ao registrar webhook: ${response.status} ${errorText}`
      );
    }

    const data = await response.json();

    if (data.error) {
      throw new ValidationError(
        `Erro do TikTok: ${data.error.message || data.error}`
      );
    }

    // Normaliza resposta
    const webhookResponse: RegisterWebhookResponse = {
      webhook_id: data.data?.webhook_id || data.webhook_id,
      event_type: data.data?.event_type || data.event_type || eventTypes,
      webhook_url: data.data?.webhook_url || data.webhook_url || webhookUrl,
      status: data.data?.status || data.status || "active",
    };

    if (!webhookResponse.webhook_id) {
      throw new ValidationError("ID do webhook não retornado pelo TikTok");
    }

    logger.info("Webhook registrado com sucesso", {
      webhookId: webhookResponse.webhook_id,
      webhookUrl,
    });

    return webhookResponse;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    logger.error("Erro ao registrar webhook", error);
    throw new ValidationError("Falha ao comunicar com API do TikTok");
  }
}

/**
 * Lista webhooks registrados
 */
export async function listWebhooks(
  accessToken: string
): Promise<WebhookListResponse> {
  const url = `${TIKTOK_API_BASE_URL}/api/v2/webhook/list`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("Erro ao listar webhooks", {
        status: response.status,
        error: errorText,
      });
      throw new ValidationError(`Falha ao listar webhooks: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new ValidationError(
        `Erro do TikTok: ${data.error.message || data.error}`
      );
    }

    return {
      webhooks: data.data?.webhooks || data.webhooks || [],
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    logger.error("Erro ao listar webhooks", error);
    throw new ValidationError("Falha ao comunicar com API do TikTok");
  }
}

/**
 * Desregistra webhook na API do TikTok Shop
 */
export async function unregisterWebhook(
  accessToken: string,
  webhookId: string
): Promise<void> {
  const url = `${TIKTOK_API_BASE_URL}/api/v2/webhook/unregister`;

  const body = {
    webhook_id: webhookId,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("Erro ao desregistrar webhook", {
        status: response.status,
        error: errorText,
        webhookId,
      });
      throw new ValidationError(
        `Falha ao desregistrar webhook: ${response.status} ${errorText}`
      );
    }

    const data = await response.json();

    if (data.error) {
      throw new ValidationError(
        `Erro do TikTok: ${data.error.message || data.error}`
      );
    }

    logger.info("Webhook desregistrado com sucesso", { webhookId });
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    logger.error("Erro ao desregistrar webhook", error);
    throw new ValidationError("Falha ao comunicar com API do TikTok");
  }
}

/**
 * Valida assinatura HMAC do webhook do TikTok
 */
export function validateWebhookSignature(
  payload: string | object,
  signature: string,
  secret: string
): boolean {
  try {
    const payloadString =
      typeof payload === "string" ? payload : JSON.stringify(payload);

    // TikTok usa HMAC SHA256
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payloadString)
      .digest("hex");

    // Compara assinaturas de forma segura (timing-safe)
    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSignature, "hex")
    );
  } catch (error) {
    logger.error("Erro ao validar assinatura do webhook", error);
    return false;
  }
}
