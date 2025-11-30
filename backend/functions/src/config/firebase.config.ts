import * as admin from "firebase-admin";

// Inicializa Firebase Admin SDK
// Em produção, as credenciais são carregadas automaticamente
// Em desenvolvimento, você pode usar Application Default Credentials ou variáveis de ambiente
if (!admin.apps.length) {
  admin.initializeApp();
}

// Exporta serviços do Firebase Admin
export const db = admin.firestore();
export const auth = admin.auth();

export default admin;
