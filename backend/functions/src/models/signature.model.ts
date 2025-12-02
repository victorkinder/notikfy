import { Timestamp } from "firebase-admin/firestore";
import { PlanId } from "./activation.model";

/**
 * Status da assinatura
 */
export type SignatureStatus = "active" | "cancelled" | "refunded";

/**
 * Informações do plano na assinatura
 */
export interface SignaturePlan {
  id: PlanId;
  name: string;
}

/**
 * Modelo de assinatura no Firestore
 */
export interface Signature {
  email: string; // ID do documento
  initial_date: Timestamp;
  final_date: Timestamp;
  update_date: Timestamp;
  status: SignatureStatus;
  plan: SignaturePlan;
  access_token: string; // Token curto gerado pelo backend
  userId?: string; // Firebase Auth UID do usuário que ativou a chave
  kiwify_order_id?: string; // ID do pedido na Kiwify
  kiwify_customer_id?: string; // ID do cliente na Kiwify
}

/**
 * Dados para criar uma nova assinatura
 */
export interface CreateSignatureData {
  email: string;
  planId: PlanId;
  planName: string;
  kiwifyOrderId?: string;
  kiwifyCustomerId?: string;
  initialDate?: Date;
  finalDate?: Date;
}

/**
 * Tipos de eventos do webhook da Kiwify
 * Baseado nos exemplos reais da documentação da Kiwify
 */
export type KiwifyEventType =
  | "order_approved"
  | "subscription_renewed"
  | "subscription_canceled"
  | "chargeback";

/**
 * Estrutura do objeto Customer nos webhooks da Kiwify
 */
export interface KiwifyCustomer {
  full_name?: string;
  first_name?: string;
  email: string;
  mobile?: string;
  cnpj?: string;
  ip?: string;
  instagram?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipcode?: string;
}

/**
 * Estrutura do objeto Product nos webhooks da Kiwify
 */
export interface KiwifyProduct {
  product_id: string;
  product_name: string;
}

/**
 * Estrutura do objeto Subscription nos webhooks da Kiwify
 */
export interface KiwifySubscription {
  id: string;
  start_date: string;
  next_payment: string;
  status: string;
  plan: {
    id: string;
    name: string;
    frequency: string;
    qty_charges: number;
  };
  charges: {
    completed: Array<{
      order_id: string;
      amount: number;
      status: string;
      installments: number;
      card_type: string;
      card_last_digits: string;
      card_first_digits?: string;
      created_at: string;
    }>;
    future: Array<{
      charge_date: string;
    }>;
  };
}

/**
 * Payload do webhook da Kiwify
 * Estrutura baseada nos exemplos reais da documentação da Kiwify
 */
export interface KiwifyWebhookPayload {
  // Campo de identificação do evento
  webhook_event_type: KiwifyEventType;

  // Dados do pedido (nível raiz)
  order_id: string;
  order_ref?: string;
  order_status: string;
  product_type?: string;
  payment_method?: string;
  store_id?: string;
  payment_merchant_id?: number;
  installments?: number;
  card_type?: string;
  card_last4digits?: string;
  card_rejection_reason?: string | null;
  boleto_URL?: string | null;
  boleto_barcode?: string | null;
  boleto_expiry_date?: string | null;
  pix_code?: string | null;
  pix_expiration?: string | null;
  sale_type?: string;
  created_at?: string;
  updated_at?: string;
  approved_date?: string | null;
  refunded_at?: string | null;

  // Objetos aninhados
  Product?: KiwifyProduct;
  Customer?: KiwifyCustomer;
  Subscription?: KiwifySubscription;
  subscription_id?: string;

  // Campos adicionais que podem estar presentes
  Commissions?: {
    charge_amount?: number;
    product_base_price?: number;
    product_base_price_currency?: string;
    kiwify_fee?: number;
    currency?: string;
    my_commission?: number;
    [key: string]: unknown;
  };
  TrackingParameters?: {
    [key: string]: unknown;
  };
  access_url?: string | null;

  // Permite campos extras
  [key: string]: unknown;
}

/**
 * Mapeamento de planos da Kiwify para nossos planos
 * Ajustar conforme os IDs dos produtos na Kiwify
 */
export const KIWIFY_PLAN_MAPPING: Record<string, PlanId> = {
  // Exemplo: mapear product_id da Kiwify para nosso planId
  // "kiwify-product-starter-id": "STARTER",
  // "kiwify-product-scaling-id": "SCALING",
  // "kiwify-product-scaled-id": "SCALED",
};

/**
 * Função para mapear product_id da Kiwify para nosso planId
 */
export function mapKiwifyProductToPlan(productId?: string): PlanId | null {
  if (!productId) {
    return null;
  }
  return KIWIFY_PLAN_MAPPING[productId] || null;
}
