import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Validação das variáveis de ambiente
const requiredEnvVars = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Verifica se todas as variáveis estão definidas
const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(
    ([key]) =>
      `VITE_${key
        .toUpperCase()
        .replace(/([A-Z])/g, "_$1")
        .slice(1)}`
  );

if (missingVars.length > 0) {
  console.error(
    "❌ Variáveis de ambiente do Firebase não encontradas:",
    missingVars.join(", ")
  );
  console.error(
    "💡 Certifique-se de que o arquivo .env existe na pasta frontend/ com todas as variáveis necessárias."
  );
}

const firebaseConfig = {
  apiKey: requiredEnvVars.apiKey || "",
  authDomain: requiredEnvVars.authDomain || "",
  projectId: requiredEnvVars.projectId || "",
  storageBucket: requiredEnvVars.storageBucket || "",
  messagingSenderId: requiredEnvVars.messagingSenderId || "",
  appId: requiredEnvVars.appId || "",
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Exporta serviços do Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
