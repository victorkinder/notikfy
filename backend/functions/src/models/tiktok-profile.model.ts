import { Timestamp } from "firebase-admin/firestore";

/**
 * Informações de OAuth do perfil TikTok
 */
export interface TikTokProfileOAuth {
  accessToken: string; // Criptografado
  refreshToken?: string; // Criptografado
  expiresAt?: Timestamp;
  shopId?: string; // ID da loja no TikTok
  webhookId?: string; // ID do webhook registrado
  isConnected: boolean;
  connectedAt?: Timestamp;
}

/**
 * Perfil do TikTok do usuário
 */
export interface TikTokProfile {
  username: string; // @username (sem o @)
  createdAt: Timestamp;
  oauth?: TikTokProfileOAuth;
}

/**
 * Requisição para criar um novo perfil do TikTok
 */
export interface CreateTikTokProfileRequest {
  username: string; // @username (com ou sem o @)
}

/**
 * Informações de OAuth para resposta HTTP
 */
export interface TikTokProfileOAuthResponse {
  isConnected: boolean;
  connectedAt?: string; // ISO timestamp string
  shopId?: string;
}

/**
 * Perfil do TikTok para resposta HTTP (com createdAt como string ISO)
 */
export interface TikTokProfileResponse {
  username: string;
  createdAt: string; // ISO timestamp string
  oauth?: TikTokProfileOAuthResponse;
}

/**
 * Resposta ao listar perfis do TikTok
 */
export interface TikTokProfilesResponse {
  profiles: TikTokProfileResponse[];
  profileLimit: number;
  currentCount: number;
}
