import { auth } from "../firebase/config";
import {
  ApiResponse,
  ApiSuccessResponse,
  ApiErrorResponse,
} from "../../types/api.types";
import { NotificationSettings } from "../../types/user.types";

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
 * Atualiza as configurações de notificação do usuário
 * @param settings Configurações de notificação
 * @returns Configurações atualizadas
 */
export async function updateNotificationSettings(
  settings: NotificationSettings
): Promise<NotificationSettings> {
  try {
    const token = await getAuthToken();
    const functionsUrl = getFunctionsUrl();

    const response = await fetch(`${functionsUrl}/updateNotificationSettings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(settings),
    });

    const data: ApiResponse<NotificationSettings> = await response.json();

    if (!response.ok || !data.success) {
      const errorData = data as ApiErrorResponse;
      throw new Error(errorData.message || "Erro ao atualizar configurações");
    }

    const successData = data as ApiSuccessResponse<NotificationSettings>;
    return successData.data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Erro desconhecido ao atualizar configurações");
  }
}

