import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = join(__dirname, "../.env");

const requiredVars = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
];

try {
  const envContent = readFileSync(envPath, "utf-8");
  const envLines = envContent.split("\n");

  console.log("🔍 Verificando arquivo .env...\n");

  const foundVars = {};
  const missingVars = [];

  requiredVars.forEach((varName) => {
    const line = envLines.find((l) => l.trim().startsWith(`${varName}=`));
    if (line) {
      const value = line.split("=")[1]?.trim() || "";
      foundVars[varName] = value;

      // Verifica se é um valor placeholder
      if (
        !value ||
        value.includes("your-") ||
        value.includes("123456789") ||
        value.includes("abcdef") ||
        value === ""
      ) {
        console.log(`⚠️  ${varName}: Valor placeholder detectado`);
      } else {
        console.log(`✅ ${varName}: Configurado`);
      }
    } else {
      missingVars.push(varName);
      console.log(`❌ ${varName}: Não encontrado`);
    }
  });

  console.log("\n" + "=".repeat(50));

  if (missingVars.length === 0) {
    const hasPlaceholders = Object.values(foundVars).some(
      (v) =>
        !v ||
        v.includes("your-") ||
        v.includes("123456789") ||
        v.includes("abcdef")
    );

    if (!hasPlaceholders) {
      console.log("✅ Todas as variáveis estão configuradas corretamente!");
    } else {
      console.log(
        "⚠️  Algumas variáveis ainda têm valores placeholder. Substitua pelos valores reais do Firebase."
      );
    }
  } else {
    console.log(
      `❌ Faltam ${missingVars.length} variável(is). Adicione ao arquivo .env:`
    );
    missingVars.forEach((v) => console.log(`   - ${v}`));
  }
} catch (error) {
  if (error.code === "ENOENT") {
    console.log("❌ Arquivo .env não encontrado!");
    console.log(`💡 Crie o arquivo em: ${envPath}`);
    console.log("\nExemplo de conteúdo:");
    requiredVars.forEach((v) => {
      console.log(`${v}=seu-valor-aqui`);
    });
  } else {
    console.error("Erro ao ler arquivo .env:", error.message);
  }
}

