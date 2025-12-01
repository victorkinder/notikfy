import { auth } from "../firebase/config";
import {
  ApiResponse,
  ApiSuccessResponse,
  ApiErrorResponse,
} from "../../types/api.types";

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
 * Inicia fluxo OAuth do TikTok Shop para um perfil específico
 * @param username Username do perfil TikTok
 */
export async function initiateOAuth(username: string): Promise<void> {
  try {
    const token = await getAuthToken();
    const functionsUrl = getFunctionsUrl();

    // Redireciona para endpoint do backend que iniciará o OAuth
    // Passa o token como query parameter já que redirecionamentos não suportam headers
    const url = `${functionsUrl}/initiateOAuth?username=${encodeURIComponent(username)}&token=${encodeURIComponent(token)}`;

    // Abre em nova janela ou redireciona diretamente
    window.location.href = url;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Erro desconhecido ao iniciar OAuth");
  }
}

/**
 * Verifica status de conexão de um perfil
 * @param username Username do perfil TikTok
 * @returns Status de conexão
 */
export async function getConnectionStatus(username: string): Promise<{
  username: string;
  isConnected: boolean;
  shopId?: string;
  connectedAt?: string;
}> {
  try {
    const token = await getAuthToken();
    const functionsUrl = getFunctionsUrl();

    const response = await fetch(
      `${functionsUrl}/getConnectionStatus?username=${encodeURIComponent(username)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data: ApiResponse<{
      username: string;
      isConnected: boolean;
      shopId?: string;
      connectedAt?: string;
    }> = await response.json();

    if (!response.ok || !data.success) {
      const errorData = data as ApiErrorResponse;
      throw new Error(
        errorData.message || "Erro ao verificar status de conexão"
      );
    }

    const successData = data as ApiSuccessResponse<{
      username: string;
      isConnected: boolean;
      shopId?: string;
      connectedAt?: string;
    }>;
    return successData.data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Erro desconhecido ao verificar status de conexão");
  }
}

/**
 * Desconecta perfil TikTok
 * @param username Username do perfil TikTok
 */
export async function disconnectTikTok(username: string): Promise<void> {
  try {
    const token = await getAuthToken();
    const functionsUrl = getFunctionsUrl();

    const response = await fetch(`${functionsUrl}/disconnectTikTok`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ username }),
    });

    const data: ApiResponse<void> = await response.json();

    if (!response.ok || !data.success) {
      const errorData = data as ApiErrorResponse;
      throw new Error(errorData.message || "Erro ao desconectar perfil");
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Erro desconhecido ao desconectar perfil");
  }
}
