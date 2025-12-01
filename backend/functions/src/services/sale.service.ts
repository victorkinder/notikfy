import { db } from "../config/firebase.config";
import { COLLECTIONS } from "../config/constants";
import { CreateSaleData, Sale } from "../models/sale.model";
import { User } from "../models/user.model";
import { NotFoundError, ValidationError } from "../utils/errors";
import { Timestamp } from "firebase-admin/firestore";
import { logger } from "../utils/logger";

/**
 * Resultado do processamento de venda com comissão acumulada
 */
export interface ProcessSaleResult {
  shouldNotify: boolean;
  newAccumulated: number;
  notificationType: "sale" | "accumulated_commission";
  notificationData?: {
    accumulatedAmount: number;
    threshold: number;
  };
  sale: Sale;
}

/**
 * Extrai a comissão do webhook data
 * Tenta diferentes campos comuns onde a comissão pode estar
 */
export function extractCommissionFromWebhook(
  webhookData: Record<string, unknown>
): number {
  // Tenta diferentes campos possíveis onde a comissão pode estar
  const possibleFields = [
    "commission",
    "my_commission",
    "Commissions.my_commission",
    "Commissions.charge_amount",
    "commission_amount",
  ];

  for (const field of possibleFields) {
    const value = getNestedValue(webhookData, field);
    if (typeof value === "number" && value >= 0) {
      return value;
    }
  }

  // Se não encontrou, retorna 0 e loga warning
  logger.warn("Comissão não encontrada no webhook", { webhookData });
  return 0;
}

/**
 * Obtém valor aninhado de um objeto usando notação de ponto
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((current: unknown, key: string) => {
    return current && typeof current === "object" && current !== null
      ? (current as Record<string, unknown>)[key]
      : undefined;
  }, obj as unknown);
}

/**
 * Processa uma venda com lógica de comissão acumulada usando transação atômica
 * Minimiza leituras/escritas usando uma única transação
 */
export async function processSaleWithAccumulatedCommission(
  userId: string,
  saleData: CreateSaleData,
  commission: number
): Promise<ProcessSaleResult> {
  if (!userId || !userId.trim()) {
    throw new ValidationError("ID do usuário é obrigatório");
  }

  if (commission < 0) {
    throw new ValidationError("Comissão não pode ser negativa");
  }

  const userRef = db.collection(COLLECTIONS.USUARIOS).doc(userId);
  const saleId = db.collection(COLLECTIONS.VENDAS).doc().id;
  const saleRef = db.collection(COLLECTIONS.VENDAS).doc(saleId);

  let shouldNotify = false;
  let finalAccumulated = 0;
  let notificationType: "sale" | "accumulated_commission" = "sale";
  let notificationData: ProcessSaleResult["notificationData"] | undefined;

  // Executa transação atômica
  await db.runTransaction(async (transaction) => {
    // 1. Ler documento do usuário
    const userDoc = await transaction.get(userRef);

    if (!userDoc.exists) {
      throw new NotFoundError("Usuário não encontrado");
    }

    const user = userDoc.data() as User;

    // 2. Obter valor acumulado atual (padrão: 0)
    const currentAccumulated = user.accumulatedCommission ?? 0;

    // 3. Calcular novo acumulado
    const newAccumulated = currentAccumulated + commission;

    // 4. Verificar configurações de notificação
    const notificationSettings = user.notificationSettings;
    notificationType = notificationSettings?.type || "sale";

    // 5. Se tipo é "accumulated_commission", verificar threshold
    if (notificationType === "accumulated_commission") {
      const threshold =
        notificationSettings?.accumulatedCommissionThreshold || 0;

      if (threshold > 0 && newAccumulated >= threshold) {
        // Threshold atingido: enviar notificação e subtrair
        shouldNotify = true;
        finalAccumulated = newAccumulated - threshold;
        notificationData = {
          accumulatedAmount: newAccumulated,
          threshold,
        };

        logger.info("Threshold de comissão acumulada atingido", {
          userId,
          newAccumulated,
          threshold,
          finalAccumulated,
        });
      } else {
        // Threshold não atingido: apenas acumular
        shouldNotify = false;
        finalAccumulated = newAccumulated;
      }
    } else {
      // Tipo "sale": não acumula, apenas mantém valor atual
      shouldNotify = false;
      finalAccumulated = currentAccumulated;
    }

    // 6. Atualizar documento do usuário com novo acumulado
    transaction.update(userRef, {
      accumulatedCommission: finalAccumulated,
      updatedAt: Timestamp.now(),
    });

    // 7. Criar documento da venda
    const sale: Sale = {
      id: saleId,
      userId: saleData.userId,
      orderId: saleData.orderId,
      productName: saleData.productName,
      amount: saleData.amount,
      currency: saleData.currency,
      status: saleData.status || "completed",
      commission,
      webhookData: saleData.webhookData,
      notificationSent: shouldNotify,
      createdAt: Timestamp.now(),
    };

    transaction.set(saleRef, sale);
  });

  logger.info("Venda processada com sucesso", {
    userId,
    saleId,
    commission,
    finalAccumulated,
    shouldNotify,
  });

  const saleDoc = await saleRef.get();
  const sale = saleDoc.data() as Sale;

  return {
    shouldNotify,
    newAccumulated: finalAccumulated,
    notificationType,
    notificationData,
    sale,
  };
}
