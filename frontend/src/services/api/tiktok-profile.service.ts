import { auth } from "../firebase/config";
import {
  ApiResponse,
  ApiSuccessResponse,
  ApiErrorResponse,
} from "../../types/api.types";
import {
  TikTokProfilesResponse,
  TikTokProfile,
  AddTikTokProfileRequest,
  RemoveTikTokProfileRequest,
} from "../../types/tiktok-profile.types";

// URL base das Cloud Functions
const getFunctionsUrl = () => {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const region = "us-central1"; // Ajuste conforme sua região
  return `https://${region}-${projectId}.cloudfunctions.net`;
};

/**
 * Obtém o token de autenticação do usuário atual
 */
async function getAuthToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Usuário não autenticado");
  }
  return await user.getIdToken();
}

/**
 * Lista todos os perfis do TikTok do usuário
 * @param activationAccessToken Token de ativação opcional
 * @returns Lista de perfis e informações de limite
 */
export async function getTikTokProfiles(
  activationAccessToken?: string
): Promise<TikTokProfilesResponse> {
  try {
    const token = await getAuthToken();
    const functionsUrl = getFunctionsUrl();

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    // Adiciona accessToken de ativação se fornecido
    if (activationAccessToken) {
      headers["x-activation-token"] = activationAccessToken;
    }

    const response = await fetch(`${functionsUrl}/getTikTokProfiles`, {
      method: "GET",
      headers,
    });

    const data: ApiResponse<TikTokProfilesResponse> = await response.json();

    if (!response.ok || !data.success) {
      const errorData = data as ApiErrorResponse;
      throw new Error(errorData.message || "Erro ao listar perfis");
    }

    const successData = data as ApiSuccessResponse<TikTokProfilesResponse>;
    return successData.data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Erro desconhecido ao listar perfis");
  }
}

/**
 * Adiciona um novo perfil do TikTok
 * @param username Username do TikTok (com ou sem @)
 * @param activationAccessToken Token de ativação opcional
 * @returns Perfil criado
 */
export async function addTikTokProfile(
  username: string,
  activationAccessToken?: string
): Promise<TikTokProfile> {
  try {
    const token = await getAuthToken();
    const functionsUrl = getFunctionsUrl();

    const requestBody: AddTikTokProfileRequest = {
      username,
    };

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    // Adiciona accessToken de ativação se fornecido
    if (activationAccessToken) {
      headers["x-activation-token"] = activationAccessToken;
    }

    const response = await fetch(`${functionsUrl}/addTikTokProfile`, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    const data: ApiResponse<TikTokProfile> = await response.json();

    if (!response.ok || !data.success) {
      const errorData = data as ApiErrorResponse;
      throw new Error(errorData.message || "Erro ao adicionar perfil");
    }

    const successData = data as ApiSuccessResponse<TikTokProfile>;
    return successData.data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Erro desconhecido ao adicionar perfil");
  }
}

/**
 * Remove um perfil do TikTok
 * @param username Username do TikTok (com ou sem @)
 */
export async function removeTikTokProfile(username: string): Promise<void> {
  try {
    const token = await getAuthToken();
    const functionsUrl = getFunctionsUrl();

    const requestBody: RemoveTikTokProfileRequest = {
      username,
    };

    const response = await fetch(`${functionsUrl}/removeTikTokProfile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    const data: ApiResponse<void> = await response.json();

    if (!response.ok || !data.success) {
      const errorData = data as ApiErrorResponse;
      throw new Error(errorData.message || "Erro ao remover perfil");
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Erro desconhecido ao remover perfil");
  }
}
