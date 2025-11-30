import { Timestamp } from "firebase-admin/firestore";

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

/**
 * Dados para criar uma nova venda
 */
export interface CreateSaleData {
  userId: string;
  orderId: string;
  productName: string;
  amount: number;
  currency: string;
  status?: SaleStatus;
  webhookData: Record<string, unknown>;
  notificationSent?: boolean;
}

/**
 * Dados para atualizar uma venda
 */
export interface UpdateSaleData {
  status?: SaleStatus;
  notificationSent?: boolean;
  productName?: string;
  amount?: number;
}
