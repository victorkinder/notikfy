/**
 * Tipos de notificação disponíveis
 */
export type NotificationType = "success" | "error" | "warning" | "info";

/**
 * Opções de configuração para uma notificação
 */
export interface NotificationOptions {
  /**
   * Duração em milissegundos que a notificação ficará visível
   * Padrão: 5000ms (5 segundos)
   * 0 = não fecha automaticamente
   */
  duration?: number;

  /**
   * Posição da notificação na tela
   * Padrão: "top-right"
   */
  position?:
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";

  /**
   * Ação customizada ao clicar na notificação
   */
  onClick?: () => void;

  /**
   * Callback quando a notificação é fechada
   */
  onClose?: () => void;

  /**
   * ID único da notificação (para controle manual)
   */
  notificationId?: string | number;
}

/**
 * Dados de uma notificação
 */
export interface Notification {
  type: NotificationType;
  message: string;
  options?: NotificationOptions;
}

/**
 * Interface do contexto de notificações
 */
export interface NotificationContextType {
  /**
   * Mostra uma notificação de sucesso
   */
  showSuccess: (message: string, options?: NotificationOptions) => void;

  /**
   * Mostra uma notificação de erro
   * Aceita Error, string ou objeto com mensagem
   */
  showError: (
    messageOrError: string | Error | unknown,
    options?: NotificationOptions
  ) => void;

  /**
   * Mostra uma notificação de aviso
   */
  showWarning: (message: string, options?: NotificationOptions) => void;

  /**
   * Mostra uma notificação informativa
   */
  showInfo: (message: string, options?: NotificationOptions) => void;

  /**
   * Remove uma notificação específica
   */
  dismiss: (notificationId: string | number) => void;

  /**
   * Remove todas as notificações
   */
  dismissAll: () => void;
}

