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
  price: number; // Preço mensal em reais
  kiwifyUrl?: string; // URL do produto na Kiwify
}

/**
 * Dados de ativação armazenados no localStorage
 */
export interface ActivationData {
  accessToken: string; // Access token curto
  planId: PlanId;
  planName: string;
  maxAccounts: number;
  activatedAt: string; // ISO timestamp
}

/**
 * Modelo de assinatura
 */
export interface Signature {
  email: string;
  initial_date: string; // ISO timestamp
  final_date: string; // ISO timestamp
  update_date: string; // ISO timestamp
  status: "active" | "cancelled" | "refunded";
  plan: {
    id: PlanId;
    name: string;
  };
  access_token: string;
  kiwify_order_id?: string;
  kiwify_customer_id?: string;
}

/**
 * Resposta de validação de access_token
 */
export interface AccessTokenValidationResponse {
  valid: boolean;
  signature?: Signature;
  message?: string;
}

/**
 * Status de ativação
 */
export interface ActivationStatus {
  isActivated: boolean;
  activationData: ActivationData | null;
}

/**
 * Resposta da API de ativação
 */
export interface ActivationResponse {
  planId: PlanId;
  planName: string;
  maxAccounts: number;
}

/**
 * Resposta da API de compra de plano
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
    price: 47,
    kiwifyUrl: "https://pay.kiwify.com.br/DKF9G1h",
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
    price: 67,
    kiwifyUrl: "https://pay.kiwify.com.br/B2NIFMl",
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
    price: 97,
    kiwifyUrl: "https://pay.kiwify.com.br/zp9u5jU",
    features: [
      "Conecte mais de 10 contas do TikTok",
      "Notificações ilimitadas",
      "Regulagem de valor para Notificação",
      "Produtos Ilimitados",
    ],
  },
};
