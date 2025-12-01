import { Timestamp } from "firebase-admin/firestore";

/**
 * Perfil do TikTok do usuário
 */
export interface TikTokProfile {
  username: string; // @username (sem o @)
  createdAt: Timestamp;
}

/**
 * Requisição para criar um novo perfil do TikTok
 */
export interface CreateTikTokProfileRequest {
  username: string; // @username (com ou sem o @)
}

/**
 * Perfil do TikTok para resposta HTTP (com createdAt como string ISO)
 */
export interface TikTokProfileResponse {
  username: string;
  createdAt: string; // ISO timestamp string
}

/**
 * Resposta ao listar perfis do TikTok
 */
export interface TikTokProfilesResponse {
  profiles: TikTokProfileResponse[];
  profileLimit: number;
  currentCount: number;
}
