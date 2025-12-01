import { Timestamp } from "firebase/firestore";
import { TikTokProfile } from "./tiktok-profile.types";

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
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
