import { Timestamp } from "firebase-admin/firestore";

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
 * Modelo de usuário no Firestore
 */
export interface User {
  uid: string; // Firebase Auth UID
  email: string;
  displayName: string;
  tiktok: TikTokConfig;
  telegram: TelegramConfig;
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
