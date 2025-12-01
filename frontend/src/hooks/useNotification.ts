/**
 * Hook reutilizável para exibir notificações
 * 
 * Este hook é um wrapper simples sobre o NotificationContext
 * para facilitar o uso e manter a API consistente.
 * 
 * @example
 * ```tsx
 * const { showSuccess, showError } = useNotification();
 * 
 * try {
 *   await apiCall();
 *   showSuccess('Operação concluída!');
 * } catch (error) {
 *   showError(error);
 * }
 * ```
 */
export { useNotification } from "../context/NotificationContext";

