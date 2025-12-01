import {
  createContext,
  useContext,
  ReactNode,
  useCallback,
} from "react";
import { toast } from "react-toastify";
import { NotificationContextType, NotificationOptions } from "../types/notification.types";
import {
  extractErrorMessage,
  isNetworkError,
  isTimeoutError,
  NOTIFICATION_MESSAGES,
} from "../services/notification.service";

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationContextProvider"
    );
  }
  return context;
};

interface NotificationContextProviderProps {
  children: ReactNode;
}

/**
 * Provider para gerenciamento centralizado de notificações
 * Utiliza react-toastify internamente para exibir toasts
 */
export const NotificationContextProvider = ({
  children,
}: NotificationContextProviderProps) => {
  /**
   * Mostra uma notificação de sucesso
   */
  const showSuccess = useCallback(
    (message: string, options?: NotificationOptions) => {
      toast.success(message, {
        autoClose: options?.duration ?? 5000,
        position: options?.position ?? "top-right",
        onClick: options?.onClick,
        onClose: options?.onClose,
        toastId: options?.notificationId,
      });
    },
    []
  );

  /**
   * Mostra uma notificação de erro
   * Aceita Error, string ou objeto com mensagem e trata automaticamente
   */
  const showError = useCallback(
    (messageOrError: string | Error | unknown, options?: NotificationOptions) => {
      let message: string;

      if (typeof messageOrError === "string") {
        message = messageOrError;
      } else if (messageOrError instanceof Error) {
        // Trata diferentes tipos de erro
        if (isNetworkError(messageOrError)) {
          message = NOTIFICATION_MESSAGES.ERROR.NETWORK;
        } else if (isTimeoutError(messageOrError)) {
          message = NOTIFICATION_MESSAGES.ERROR.TIMEOUT;
        } else {
          message = extractErrorMessage(messageOrError);
        }
      } else {
        message = extractErrorMessage(messageOrError);
      }

      toast.error(message, {
        autoClose: options?.duration ?? 7000, // Erros ficam mais tempo visíveis
        position: options?.position ?? "top-right",
        onClick: options?.onClick,
        onClose: options?.onClose,
        toastId: options?.notificationId,
      });
    },
    []
  );

  /**
   * Mostra uma notificação de aviso
   */
  const showWarning = useCallback(
    (message: string, options?: NotificationOptions) => {
      toast.warning(message, {
        autoClose: options?.duration ?? 6000,
        position: options?.position ?? "top-right",
        onClick: options?.onClick,
        onClose: options?.onClose,
        toastId: options?.notificationId,
      });
    },
    []
  );

  /**
   * Mostra uma notificação informativa
   */
  const showInfo = useCallback(
    (message: string, options?: NotificationOptions) => {
      toast.info(message, {
        autoClose: options?.duration ?? 5000,
        position: options?.position ?? "top-right",
        onClick: options?.onClick,
        onClose: options?.onClose,
        toastId: options?.notificationId,
      });
    },
    []
  );

  /**
   * Remove uma notificação específica
   */
  const dismiss = useCallback((notificationId: string | number) => {
    toast.dismiss(notificationId);
  }, []);

  /**
   * Remove todas as notificações
   */
  const dismissAll = useCallback(() => {
    toast.dismiss();
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        showSuccess,
        showError,
        showWarning,
        showInfo,
        dismiss,
        dismissAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

