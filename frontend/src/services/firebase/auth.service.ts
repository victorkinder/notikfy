import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { auth } from "./config";

const googleProvider = new GoogleAuthProvider();

// Configura parâmetros customizados para melhorar a experiência de login
// Nota: O nome do serviço exibido na tela de login do Google é baseado no
// "Nome público do projeto" configurado no Firebase Console.
// Para alterá-lo, acesse: Firebase Console > Configurações do projeto > Geral > Nome público do projeto
googleProvider.setCustomParameters({
  prompt: "select_account", // Sempre mostra a tela de seleção de conta
});

/**
 * Realiza login com Google usando popup
 */
export const signInWithGoogle = async () => {
  return await signInWithPopup(auth, googleProvider);
};

/**
 * Realiza logout do usuário
 */
export const logout = async () => {
  return await signOut(auth);
};

/**
 * Observa mudanças no estado de autenticação
 * @param callback Função chamada quando o estado de autenticação muda
 * @returns Função para cancelar a observação
 */
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
