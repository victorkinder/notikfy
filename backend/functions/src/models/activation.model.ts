import { Timestamp } from "firebase-admin/firestore";

/**
 * IDs dos planos disponíveis
 */
export type PlanId = "STARTER" | "SCALING" | "SCALED";

/**
 * Informações de um plano
 */
export interface Plan {
  id: PlanId;
  name: string;
  maxAccounts: number;
  features: string[];
}

/**
 * Chave de ativação no Firestore
 */
export interface ActivationKey {
  key: string; // chave única
  planId: PlanId;
  userId?: string; // usuário que ativou (se já foi usado)
  used: boolean;
  usedAt?: Timestamp;
  createdAt: Timestamp;
}

/**
 * Dados para criar uma nova chave de ativação
 */
export interface CreateActivationKeyData {
  key: string;
  planId: PlanId;
}

/**
 * Requisição para ativar uma chave
 */
export interface ActivationRequest {
  key: string;
}

/**
 * Resposta de ativação bem-sucedida
 */
export interface ActivationResponse {
  planId: PlanId;
  planName: string;
  maxAccounts: number;
}

/**
 * Requisição para comprar um plano
 */
export interface PurchasePlanRequest {
  planId: PlanId;
}

/**
 * Resposta de compra de plano
 */
export interface PurchasePlanResponse {
  key: string;
  planId: PlanId;
  planName: string;
  maxAccounts: number;
}

/**
 * Planos disponíveis
 */
export const PLANS: Record<PlanId, Plan> = {
  STARTER: {
    id: "STARTER",
    name: "Iniciante",
    maxAccounts: 5,
    features: [
      "Conecte até 5 contas do TikTok ao mesmo tempo",
      "Notificações ilimitadas",
      "Regulagem de valor para Notificação",
      "Produtos Ilimitados",
    ],
  },
  SCALING: {
    id: "SCALING",
    name: "Escalando",
    maxAccounts: 10,
    features: [
      "Conecte até 10 contas do TikTok",
      "Notificações ilimitadas",
      "Regulagem de valor para Notificação",
      "Produtos Ilimitados",
    ],
  },
  SCALED: {
    id: "SCALED",
    name: "Escalado",
    maxAccounts: 999, // Mais de 10 contas (representado como 999)
    features: [
      "Conecte mais de 10 contas do TikTok",
      "Notificações ilimitadas",
      "Regulagem de valor para Notificação",
      "Produtos Ilimitados",
    ],
  },
};
