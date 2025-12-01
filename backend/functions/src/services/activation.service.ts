import { db } from "../config/firebase.config";
import { COLLECTIONS } from "../config/constants";
import {
  ActivationKey,
  PlanId,
  ActivationResponse,
  CreateActivationKeyData,
  PLANS,
} from "../models/activation.model";
import { NotFoundError, ValidationError } from "../utils/errors";
import { Timestamp } from "firebase-admin/firestore";
import { logger } from "../utils/logger";
import { randomBytes } from "crypto";

/**
 * Valida e ativa uma chave de ativação
 * @param key Chave de ativação
 * @param userId ID do usuário que está ativando
 * @returns Dados do plano associado à chave
 */
export async function validateAndActivateKey(
  key: string,
  userId: string
): Promise<ActivationResponse> {
  if (!key || !key.trim()) {
    throw new ValidationError("Chave de ativação é obrigatória");
  }

  if (!userId || !userId.trim()) {
    throw new ValidationError("ID do usuário é obrigatório");
  }

  // Busca a chave no Firestore
  const activationKeyRef = db.collection(COLLECTIONS.ACTIVATION_KEYS).doc(key);
  const activationKeyDoc = await activationKeyRef.get();

  if (!activationKeyDoc.exists) {
    logger.warn("Chave de ativação não encontrada", { key });
    throw new NotFoundError("Chave de ativação inválida");
  }

  const activationKey = activationKeyDoc.data() as ActivationKey;

  // Verifica se a chave já foi usada
  if (activationKey.used) {
    logger.warn("Tentativa de usar chave já utilizada", {
      key,
      userId,
      usedBy: activationKey.userId,
    });
    throw new ValidationError("Esta chave de ativação já foi utilizada");
  }

  // Verifica se a chave já está associada a outro usuário
  if (activationKey.userId && activationKey.userId !== userId) {
    logger.warn("Tentativa de usar chave de outro usuário", {
      key,
      userId,
      owner: activationKey.userId,
    });
    throw new ValidationError(
      "Esta chave de ativação pertence a outro usuário"
    );
  }

  // Obtém informações do plano
  const plan = PLANS[activationKey.planId];
  if (!plan) {
    logger.error("Plano não encontrado", { planId: activationKey.planId });
    throw new NotFoundError("Plano associado à chave não foi encontrado");
  }

  // Marca a chave como usada
  await activationKeyRef.update({
    used: true,
    userId: userId,
    usedAt: Timestamp.now(),
  });

  logger.info("Chave de ativação validada e ativada com sucesso", {
    key,
    userId,
    planId: activationKey.planId,
  });

  return {
    planId: activationKey.planId,
    planName: plan.name,
    maxAccounts: plan.maxAccounts,
  };
}

/**
 * Gera uma chave única de ativação
 * @returns Chave de ativação gerada (16 caracteres hexadecimais)
 */
function generateUniqueKey(): string {
  return randomBytes(8).toString("hex").toUpperCase();
}

/**
 * Gera uma nova chave de ativação para um plano
 * @param planId ID do plano
 * @returns Chave de ativação gerada
 */
export async function generateActivationKey(planId: PlanId): Promise<string> {
  if (!planId || !PLANS[planId]) {
    throw new ValidationError("ID do plano inválido");
  }

  // Gera uma chave única
  const key = generateUniqueKey();

  // Verifica se a chave já existe (muito improvável, mas por segurança)
  const existingKey = await db
    .collection(COLLECTIONS.ACTIVATION_KEYS)
    .doc(key)
    .get();

  if (existingKey.exists) {
    // Se por acaso a chave já existir, gera outra
    return generateActivationKey(planId);
  }

  // Cria a chave no Firestore
  const activationKeyData: CreateActivationKeyData = {
    key,
    planId,
  };

  await db
    .collection(COLLECTIONS.ACTIVATION_KEYS)
    .doc(key)
    .set({
      ...activationKeyData,
      used: false,
      createdAt: Timestamp.now(),
    });

  logger.info("Chave de ativação gerada com sucesso", { key, planId });

  return key;
}

/**
 * Cria uma nova chave de ativação para um plano (usado na compra)
 * @param planId ID do plano
 * @returns Dados da chave criada
 */
export async function createActivationKeyForPlan(planId: PlanId): Promise<{
  key: string;
  planId: PlanId;
  planName: string;
  maxAccounts: number;
}> {
  const key = await generateActivationKey(planId);
  const plan = PLANS[planId];

  return {
    key,
    planId,
    planName: plan.name,
    maxAccounts: plan.maxAccounts,
  };
}
