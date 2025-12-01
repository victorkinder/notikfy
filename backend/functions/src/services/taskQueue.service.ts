import { CloudTasksClient } from "@google-cloud/tasks";
import { logger } from "../utils/logger";
import { ValidationError } from "../utils/errors";

/**
 * Tipos de notificação que podem ser enfileiradas
 */
export type NotificationType = "sale" | "accumulated_commission";

/**
 * Payload para notificação de venda
 */
export interface SaleNotificationPayload {
  type: "sale";
  userId: string;
  saleData: {
    productName: string;
    amount: number;
    currency: string;
    orderId: string;
  };
}

/**
 * Payload para notificação de comissão acumulada
 */
export interface AccumulatedCommissionNotificationPayload {
  type: "accumulated_commission";
  userId: string;
  accumulatedAmount: number;
  threshold: number;
}

/**
 * Payload unificado para notificações
 */
export type NotificationPayload =
  | SaleNotificationPayload
  | AccumulatedCommissionNotificationPayload;

/**
 * Configuração do Cloud Tasks
 */
interface TaskQueueConfig {
  projectId: string;
  location: string;
  queueName: string;
  functionUrl: string;
}

/**
 * Obtém configuração do Cloud Tasks
 */
function getTaskQueueConfig(): TaskQueueConfig {
  const projectId =
    process.env.GCLOUD_PROJECT ||
    process.env.GCP_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.FIREBASE_PROJECT_ID;

  if (!projectId) {
    throw new Error(
      "Project ID não encontrado. Configure GCLOUD_PROJECT ou FIREBASE_PROJECT_ID"
    );
  }

  const location = process.env.FUNCTION_REGION || "us-central1";
  const queueName = process.env.NOTIFICATION_QUEUE_NAME || "notification-queue";

  // URL da função de processamento de notificações
  // Em produção, será a URL real da Cloud Function
  // Em desenvolvimento, pode ser uma URL local ou do emulador
  const functionUrl =
    process.env.NOTIFICATION_TASK_URL ||
    `https://${location}-${projectId}.cloudfunctions.net/processNotificationTask`;

  return {
    projectId,
    location,
    queueName,
    functionUrl,
  };
}

/**
 * Cliente do Cloud Tasks (singleton)
 */
let tasksClient: CloudTasksClient | null = null;

/**
 * Obtém ou cria cliente do Cloud Tasks
 */
function getTasksClient(): CloudTasksClient {
  if (!tasksClient) {
    tasksClient = new CloudTasksClient();
  }
  return tasksClient;
}

/**
 * Enfileira uma notificação para processamento assíncrono
 *
 * @param payload - Payload da notificação a ser enfileirada
 * @returns ID da tarefa criada
 */
export async function enqueueNotification(
  payload: NotificationPayload
): Promise<string> {
  if (!payload.userId) {
    throw new ValidationError("userId é obrigatório no payload");
  }

  if (!payload.type) {
    throw new ValidationError("type é obrigatório no payload");
  }

  try {
    const config = getTaskQueueConfig();
    const client = getTasksClient();

    // Caminho completo da fila
    const queuePath = client.queuePath(
      config.projectId,
      config.location,
      config.queueName
    );

    // Cria a tarefa
    const task = {
      httpRequest: {
        httpMethod: "POST" as const,
        url: config.functionUrl,
        headers: {
          "Content-Type": "application/json",
        },
        body: Buffer.from(JSON.stringify(payload)).toString("base64"),
      },
    };

    // Envia a tarefa para a fila
    const [response] = await client.createTask({
      parent: queuePath,
      task,
    });

    const taskId = response.name?.split("/").pop() || "unknown";

    logger.info("Notificação enfileirada com sucesso", {
      taskId,
      notificationType: payload.type,
      userId: payload.userId,
    });

    return taskId;
  } catch (error) {
    logger.error("Erro ao enfileirar notificação", error);
    throw error;
  }
}

/**
 * Enfileira notificação de venda
 */
export async function enqueueSaleNotification(
  userId: string,
  saleData: {
    productName: string;
    amount: number;
    currency: string;
    orderId: string;
  }
): Promise<string> {
  const payload: SaleNotificationPayload = {
    type: "sale",
    userId,
    saleData,
  };

  return enqueueNotification(payload);
}

/**
 * Enfileira notificação de comissão acumulada
 */
export async function enqueueAccumulatedCommissionNotification(
  userId: string,
  accumulatedAmount: number,
  threshold: number
): Promise<string> {
  const payload: AccumulatedCommissionNotificationPayload = {
    type: "accumulated_commission",
    userId,
    accumulatedAmount,
    threshold,
  };

  return enqueueNotification(payload);
}
