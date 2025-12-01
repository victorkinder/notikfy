import { findUserByUid } from "./user.service";
import { logger } from "../utils/logger";
import { NotFoundError, ValidationError } from "../utils/errors";

/**
 * Envia notificação de venda via Telegram
 *
 * NOTA: Para melhor performance, prefira usar enfileiramento assíncrono via
 * taskQueue.service.ts (enqueueSaleNotification) ao invés de chamar esta
 * função diretamente. Esta função é usada internamente pelo processNotificationTask.
 */
export async function sendSaleNotification(
  userId: string,
  saleData: {
    productName: string;
    amount: number;
    currency: string;
    orderId: string;
  }
): Promise<void> {
  const user = await findUserByUid(userId);
  if (!user) {
    throw new NotFoundError("Usuário não encontrado");
  }

  if (
    !user.telegram.isConfigured ||
    !user.telegram.botToken ||
    !user.telegram.chatId
  ) {
    logger.warn("Telegram não configurado para usuário", { userId });
    return;
  }

  const message = formatSaleMessage(saleData);

  await sendTelegramMessage(
    user.telegram.botToken,
    user.telegram.chatId,
    message
  );

  logger.info("Notificação de venda enviada", {
    userId,
    orderId: saleData.orderId,
  });
}

/**
 * Envia notificação de comissão acumulada via Telegram
 *
 * NOTA: Para melhor performance, prefira usar enfileiramento assíncrono via
 * taskQueue.service.ts (enqueueAccumulatedCommissionNotification) ao invés de chamar esta
 * função diretamente. Esta função é usada internamente pelo processNotificationTask.
 */
export async function sendAccumulatedCommissionNotification(
  userId: string,
  accumulatedAmount: number,
  threshold: number
): Promise<void> {
  const user = await findUserByUid(userId);
  if (!user) {
    throw new NotFoundError("Usuário não encontrado");
  }

  if (
    !user.telegram.isConfigured ||
    !user.telegram.botToken ||
    !user.telegram.chatId
  ) {
    logger.warn("Telegram não configurado para usuário", { userId });
    return;
  }

  const message = formatAccumulatedCommissionMessage(
    accumulatedAmount,
    threshold
  );

  await sendTelegramMessage(
    user.telegram.botToken,
    user.telegram.chatId,
    message
  );

  logger.info("Notificação de comissão acumulada enviada", {
    userId,
    accumulatedAmount,
    threshold,
  });
}

/**
 * Formata mensagem de venda
 */
function formatSaleMessage(saleData: {
  productName: string;
  amount: number;
  currency: string;
  orderId: string;
}): string {
  const formattedAmount = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: saleData.currency || "BRL",
  }).format(saleData.amount);

  return (
    `🛍️ *Nova Venda!*\n\n` +
    `📦 Produto: ${saleData.productName}\n` +
    `💰 Valor: ${formattedAmount}\n` +
    `🆔 Pedido: ${saleData.orderId}\n\n` +
    `Parabéns pela venda! 🎉`
  );
}

/**
 * Formata mensagem de comissão acumulada
 */
function formatAccumulatedCommissionMessage(
  accumulatedAmount: number,
  threshold: number
): string {
  const formattedAccumulated = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(accumulatedAmount);

  const formattedThreshold = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(threshold);

  return (
    `💰 *Comissão Acumulada Atingida!*\n\n` +
    `🎯 Threshold: ${formattedThreshold}\n` +
    `💵 Valor Acumulado: ${formattedAccumulated}\n\n` +
    `Parabéns! Você atingiu o valor mínimo de comissão acumulada! 🎉`
  );
}

/**
 * Envia mensagem via Telegram Bot API
 */
async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  message: string
): Promise<void> {
  if (!botToken || !chatId) {
    throw new ValidationError("Token do bot e chat ID são obrigatórios");
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Erro ao enviar mensagem Telegram: ${response.status} - ${JSON.stringify(errorData)}`
      );
    }

    const result = await response.json();
    if (!result.ok) {
      throw new Error(`Telegram API retornou erro: ${result.description}`);
    }
  } catch (error) {
    logger.error("Erro ao enviar mensagem Telegram", { error, chatId });
    throw error;
  }
}
