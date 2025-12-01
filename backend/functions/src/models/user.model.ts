import { Timestamp } from "firebase-admin/firestore";
import { TikTokProfile } from "./tiktok-profile.model";

/**
 * Configurações do TikTok para o usuário
 */
export interface TikTokConfig {
  accessToken: string; // Criptografado
  webhookUrl: string;
  isValid: boolean;
}

/**
 * Configurações do Telegram para o usuário
 */
export interface TelegramConfig {
  botToken: string; // Criptografado
  chatId: string;
  isConfigured: boolean;
}

/**
 * Configurações de notificação do usuário
 */
export interface NotificationSettings {
  type: "sale" | "accumulated_commission";
  accumulatedCommissionThreshold?: number; // 50, 100, 250, 500, 1000
}

/**
 * Modelo de usuário no Firestore
 */
export interface User {
  uid: string; // Firebase Auth UID
  email: string;
  displayName: string;
  tiktok: TikTokConfig;
  telegram: TelegramConfig;
  tiktokProfiles?: TikTokProfile[]; // Perfis do TikTok cadastrados
  notificationSettings?: NotificationSettings;
  accumulatedCommission?: number; // Comissão acumulada para notificações (padrão: 0)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Dados para criar um novo usuário
 */
export interface CreateUserData {
  uid: string;
  email: string;
  displayName: string;
}

/**
 * Dados para atualizar configurações do TikTok
 */
export interface UpdateTikTokConfigData {
  accessToken: string;
  webhookUrl: string;
  isValid?: boolean;
}

/**
 * Dados para atualizar configurações do Telegram
 */
export interface UpdateTelegramConfigData {
  botToken: string;
  chatId: string;
  isConfigured?: boolean;
}

/**
 * Dados para atualizar configurações de notificação
 */
export interface UpdateNotificationSettingsData {
  type: "sale" | "accumulated_commission";
  accumulatedCommissionThreshold?: number;
}
