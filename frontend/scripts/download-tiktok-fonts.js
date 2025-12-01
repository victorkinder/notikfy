import https from "https";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fontsDir = join(__dirname, "../public/fonts");
const repoUrl = "https://github.com/tiktok/TikTokSans";

// Garantir que o diretório existe
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

console.log("📥 Para baixar as fontes TikTok Sans:");
console.log(`\n1. Acesse: ${repoUrl}`);
console.log("2. Navegue até a pasta com os arquivos de fonte");
console.log("3. Baixe os seguintes arquivos:");
console.log("   - TikTokSans-Regular.woff2 (ou .woff / .ttf)");
console.log("   - TikTokSans-Medium.woff2 (ou .woff / .ttf)");
console.log("   - TikTokSans-Bold.woff2 (ou .woff / .ttf)");
console.log(`\n4. Coloque os arquivos em: ${fontsDir}`);
console.log("\n💡 Alternativa: Use o GitHub CLI para clonar o repositório:");
console.log("   gh repo clone tiktok/TikTokSans");
console.log("   Depois copie os arquivos .woff2 ou .woff para a pasta fonts/");

