import { Timestamp } from "firebase/firestore";

/**
 * Status de uma venda
 */
export type SaleStatus = "pending" | "completed" | "refunded";

/**
 * Modelo de venda no Firestore
 */
export interface Sale {
  id: string;
  userId: string; // Referência ao usuário
  orderId: string; // ID da venda no TikTok
  productName: string;
  amount: number;
  currency: string;
  status: SaleStatus;
  webhookData: Record<string, unknown>; // Dados completos do webhook
  notificationSent: boolean;
  createdAt: Timestamp;
}
