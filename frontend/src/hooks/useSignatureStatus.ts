import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useActivation } from "../context/ActivationContext";
import { validateAccessToken } from "../services/api/activation.service";
import { logout } from "../services/firebase/auth.service";

/**
 * Hook para verificar status da assinatura periodicamente
 * Desloga usuário se assinatura for cancelada ou reembolsada
 */
export const useSignatureStatus = (checkInterval: number = 60000) => {
  const { user } = useAuth();
  const { activationStatus, clearActivation } = useActivation();

  useEffect(() => {
    if (
      !user ||
      !activationStatus.isActivated ||
      !activationStatus.activationData
    ) {
      return;
    }

    const checkStatus = async () => {
      try {
        const validation = await validateAccessToken(
          activationStatus.activationData!.accessToken
        );

        // Se token inválido ou assinatura cancelada/reembolsada, desloga
        if (!validation.valid || !validation.signature) {
          clearActivation();
          await logout();
          window.location.href = "/login";
          return;
        }

        const signature = validation.signature;

        // Se status for cancelled ou refunded, desloga
        if (
          signature.status === "cancelled" ||
          signature.status === "refunded"
        ) {
          clearActivation();
          await logout();
          window.location.href = "/login";
        }
      } catch (error) {
        console.error("Erro ao verificar status da assinatura:", error);
        // Em caso de erro, não desloga (pode ser erro de rede temporário)
      }
    };

    // Verifica imediatamente
    checkStatus();

    // Configura verificação periódica
    const interval = setInterval(checkStatus, checkInterval);

    return () => clearInterval(interval);
  }, [user, activationStatus, clearActivation, checkInterval]);
};
