import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { ActivationData, ActivationStatus } from "../types/activation.types";
import { validateAccessToken as validateAccessTokenService } from "../services/api/activation.service";
import { PLANS } from "../types/activation.types";

const ACTIVATION_STORAGE_KEY = "notikfy_activation";

interface ActivationContextType {
  activationStatus: ActivationStatus;
  loading: boolean;
  activate: (accessToken: string) => Promise<void>;
  validateTokenOnLogin: () => Promise<boolean>;
  clearActivation: () => void;
  checkActivation: () => void;
}

export const ActivationContext = createContext<
  ActivationContextType | undefined
>(undefined);

export const useActivation = () => {
  const context = useContext(ActivationContext);
  if (!context) {
    throw new Error(
      "useActivation must be used within an ActivationContextProvider"
    );
  }
  return context;
};

interface ActivationContextProviderProps {
  children: ReactNode;
}

/**
 * Carrega dados de ativação do localStorage
 */
function loadActivationFromStorage(): ActivationData | null {
  try {
    const stored = localStorage.getItem(ACTIVATION_STORAGE_KEY);
    if (!stored) {
      return null;
    }
    const data = JSON.parse(stored) as ActivationData;
    // Valida se os dados estão completos
    if (
      data.accessToken &&
      data.planId &&
      data.planName &&
      data.maxAccounts &&
      data.activatedAt
    ) {
      return data;
    }
    return null;
  } catch (error) {
    console.error("Erro ao carregar ativação do localStorage:", error);
    return null;
  }
}

/**
 * Salva dados de ativação no localStorage
 */
function saveActivationToStorage(data: ActivationData): void {
  try {
    localStorage.setItem(ACTIVATION_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Erro ao salvar ativação no localStorage:", error);
  }
}

/**
 * Remove dados de ativação do localStorage
 */
function removeActivationFromStorage(): void {
  try {
    localStorage.removeItem(ACTIVATION_STORAGE_KEY);
  } catch (error) {
    console.error("Erro ao remover ativação do localStorage:", error);
  }
}

export const ActivationContextProvider = ({
  children,
}: ActivationContextProviderProps) => {
  const [activationData, setActivationData] = useState<ActivationData | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  // Carrega ativação do localStorage ao montar
  useEffect(() => {
    const stored = loadActivationFromStorage();
    setActivationData(stored);
    setLoading(false);
  }, []);

  /**
   * Verifica o status de ativação
   */
  const checkActivation = useCallback(() => {
    const stored = loadActivationFromStorage();
    setActivationData(stored);
  }, []);

  /**
   * Ativa um access_token
   */
  const activate = useCallback(async (accessToken: string) => {
    try {
      setLoading(true);
      // Valida o token com o backend
      const validation = await validateAccessTokenService(accessToken);

      if (!validation.valid || !validation.signature) {
        throw new Error(validation.message || "Access token inválido");
      }

      const signature = validation.signature;
      const activationData: ActivationData = {
        accessToken,
        planId: signature.plan.id,
        planName: signature.plan.name,
        maxAccounts: PLANS[signature.plan.id].maxAccounts,
        activatedAt: new Date().toISOString(),
      };

      saveActivationToStorage(activationData);
      setActivationData(activationData);
    } catch (error) {
      console.error("Erro ao ativar access token:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Valida o token quando o usuário faz login
   */
  /**
   * Limpa a ativação
   */
  var clearActivation = useCallback(() => {
    removeActivationFromStorage();
    setActivationData(null);
  }, []);

  /**
   * Valida o token quando o usuário faz login
   */
  const validateTokenOnLogin = useCallback(async (): Promise<boolean> => {
    try {
      const stored = loadActivationFromStorage();
      if (!stored || !stored.accessToken) {
        return false;
      }

      const validation = await validateAccessTokenService(stored.accessToken);

      if (!validation.valid) {
        // Token inválido, limpa a ativação
        removeActivationFromStorage();
        setActivationData(null);
        return false;
      }

      // Atualiza dados se necessário
      if (validation.signature) {
        const signature = validation.signature;
        const activationData: ActivationData = {
          accessToken: stored.accessToken,
          planId: signature.plan.id,
          planName: signature.plan.name,
          maxAccounts: PLANS[signature.plan.id].maxAccounts,
          activatedAt: stored.activatedAt,
        };
        saveActivationToStorage(activationData);
        setActivationData(activationData);
      }

      return true;
    } catch (error) {
      console.error("Erro ao validar token no login:", error);
      removeActivationFromStorage();
      setActivationData(null);
      return false;
    }
  }, []);

  /**
   * Limpa a ativação
   */
  clearActivation = useCallback(() => {
    removeActivationFromStorage();
    setActivationData(null);
  }, []);

  const activationStatus: ActivationStatus = {
    isActivated: activationData !== null,
    activationData,
  };

  return (
    <ActivationContext.Provider
      value={{
        activationStatus,
        loading,
        activate,
        validateTokenOnLogin,
        clearActivation,
        checkActivation,
      }}
    >
      {children}
    </ActivationContext.Provider>
  );
};
