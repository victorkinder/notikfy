/**
 * Perfil do TikTok do usuário
 */
export interface TikTokProfile {
  username: string; // @username (sem o @)
  createdAt: string; // ISO timestamp
}

/**
 * Resposta ao listar perfis do TikTok
 */
export interface TikTokProfilesResponse {
  profiles: TikTokProfile[];
  profileLimit: number;
  currentCount: number;
}

/**
 * Requisição para adicionar perfil TikTok
 */
export interface AddTikTokProfileRequest {
  username: string;
}

/**
 * Requisição para remover perfil TikTok
 */
export interface RemoveTikTokProfileRequest {
  username: string;
}

