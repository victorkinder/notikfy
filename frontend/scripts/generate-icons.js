import sharp from "sharp";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync, mkdirSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const inputFile = join(__dirname, "../public/icons/Untitled design (16).png");
const publicDir = join(__dirname, "../public");
const iconsDir = join(publicDir, "icons");

// Garantir que os diretórios existem
if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true });
}

// Configuração dos ícones a gerar
const iconSizes = [
  { name: "icon-192x192.png", size: 192 },
  { name: "icon-512x512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "favicon-16x16.png", size: 16 },
  { name: "favicon-32x32.png", size: 32 },
  { name: "favicon-48x48.png", size: 48 },
];

async function generateIcons() {
  try {
    console.log("🖼️  Gerando ícones a partir do arquivo original...");
    console.log(`📁 Arquivo de origem: ${inputFile}`);

    if (!existsSync(inputFile)) {
      throw new Error(`Arquivo não encontrado: ${inputFile}`);
    }

    // Gerar todos os ícones
    for (const icon of iconSizes) {
      const outputPath = join(iconsDir, icon.name);
      await sharp(inputFile)
        .resize(icon.size, icon.size, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 }, // Transparente
        })
        .png()
        .toFile(outputPath);

      console.log(`✅ Gerado: ${icon.name} (${icon.size}x${icon.size})`);
    }

    // Gerar favicon.ico (múltiplos tamanhos em um arquivo)
    const favicon16 = await sharp(inputFile)
      .resize(16, 16, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    const favicon32 = await sharp(inputFile)
      .resize(32, 32, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    const favicon48 = await sharp(inputFile)
      .resize(48, 48, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    // Para .ico, vamos criar um PNG simples por enquanto
    // (gerar .ico real requer biblioteca adicional)
    const faviconPath = join(publicDir, "favicon.ico");
    await sharp(inputFile)
      .resize(32, 32, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(faviconPath.replace(".ico", ".png"));

    // Copiar o favicon-32x32.png como favicon.ico (temporário)
    await sharp(join(iconsDir, "favicon-32x32.png"))
      .toFile(faviconPath.replace(".ico", "-temp.png"));

    console.log(`✅ Gerado: favicon.png (32x32)`);
    console.log("\n✨ Todos os ícones foram gerados com sucesso!");
    console.log("\n📝 Nota: Para gerar um favicon.ico real, você pode usar:");
    console.log("   https://realfavicongenerator.net/");
    console.log("   ou converter os PNGs gerados manualmente.");

  } catch (error) {
    console.error("❌ Erro ao gerar ícones:", error.message);
    process.exit(1);
  }
}

generateIcons();

