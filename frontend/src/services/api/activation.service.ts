import { auth } from "../firebase/config";
import {
  ApiResponse,
  ApiSuccessResponse,
  ApiErrorResponse,
} from "../../types/api.types";
import {
  ActivationResponse,
  PurchasePlanResponse,
  PlanId,
  AccessTokenValidationResponse,
} from "../../types/activation.types";

// URL base das Cloud Functions
// Em produção, isso deve vir de variáveis de ambiente
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
 * Ativa uma chave de ativação
 * @param key Chave de ativação
 * @returns Dados do plano ativado
 */
export async function activateKey(key: string): Promise<ActivationResponse> {
  try {
    const token = await getAuthToken();
    const functionsUrl = getFunctionsUrl();

    const response = await fetch(`${functionsUrl}/activateKey`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ key }),
    });

    const data: ApiResponse<ActivationResponse> = await response.json();

    if (!response.ok || !data.success) {
      const errorData = data as ApiErrorResponse;
      throw new Error(errorData.message || "Erro ao ativar chave");
    }

    const successData = data as ApiSuccessResponse<ActivationResponse>;
    return successData.data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Erro desconhecido ao ativar chave");
  }
}

/**
 * Compra um plano e gera uma chave de ativação
 * @param planId ID do plano
 * @returns Dados da chave gerada
 */
export async function purchasePlan(
  planId: PlanId
): Promise<PurchasePlanResponse> {
  try {
    const token = await getAuthToken();
    const functionsUrl = getFunctionsUrl();

    const response = await fetch(`${functionsUrl}/purchasePlan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ planId }),
    });

    const data: ApiResponse<PurchasePlanResponse> = await response.json();

    if (!response.ok || !data.success) {
      const errorData = data as ApiErrorResponse;
      throw new Error(errorData.message || "Erro ao comprar plano");
    }

    const successData = data as ApiSuccessResponse<PurchasePlanResponse>;
    return successData.data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Erro desconhecido ao comprar plano");
  }
}

/**
 * Valida um access_token com o backend
 * @param accessToken Access token a ser validado
 * @returns Resposta de validação com dados da assinatura
 */
export async function validateAccessToken(
  accessToken: string
): Promise<AccessTokenValidationResponse> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Usuário não autenticado");
    }

    const idToken = await user.getIdToken();
    const functionsUrl = getFunctionsUrl();

    const response = await fetch(`${functionsUrl}/validateAccessToken`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accessToken,
        idToken,
      }),
    });

    const data: ApiResponse<AccessTokenValidationResponse> =
      await response.json();

    if (!response.ok || !data.success) {
      const errorData = data as ApiErrorResponse;
      throw new Error(errorData.message || "Erro ao validar access token");
    }

    const successData =
      data as ApiSuccessResponse<AccessTokenValidationResponse>;
    return successData.data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Erro desconhecido ao validar access token");
  }
}
