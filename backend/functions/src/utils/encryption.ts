import * as crypto from "crypto";
import { logger } from "./logger";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 16 bytes para AES
const SALT_LENGTH = 64; // 64 bytes para salt
const TAG_LENGTH = 16; // 16 bytes para GCM tag
const KEY_LENGTH = 32; // 32 bytes para AES-256

/**
 * Obtém a chave de criptografia das variáveis de ambiente
 * Se não existir, gera um erro
 */
function getEncryptionKey(): Buffer {
  const encryptionKey = process.env.TIKTOK_ENCRYPTION_KEY;

  if (!encryptionKey) {
    throw new Error(
      "TIKTOK_ENCRYPTION_KEY não configurada. Configure uma chave de 32 bytes (base64) nas variáveis de ambiente."
    );
  }

  try {
    // Tenta decodificar como base64
    const keyBuffer = Buffer.from(encryptionKey, "base64");
    if (keyBuffer.length !== KEY_LENGTH) {
      throw new Error(
        `TIKTOK_ENCRYPTION_KEY deve ter ${KEY_LENGTH} bytes (${KEY_LENGTH * 2} caracteres hex ou ${Math.ceil((KEY_LENGTH * 4) / 3)} caracteres base64)`
      );
    }
    return keyBuffer;
  } catch (error) {
    // Se falhar, tenta usar diretamente (deve ter 32 bytes)
    if (encryptionKey.length === KEY_LENGTH) {
      return Buffer.from(encryptionKey, "utf8");
    }
    throw new Error(
      `TIKTOK_ENCRYPTION_KEY inválida. Use uma chave de ${KEY_LENGTH} bytes codificada em base64.`
    );
  }
}

/**
 * Criptografa um texto usando AES-256-GCM
 * @param text Texto a ser criptografado
 * @returns String base64 contendo: salt + iv + tag + encryptedData
 */
export function encrypt(text: string): string {
  if (!text) {
    return "";
  }

  try {
    const key = getEncryptionKey();
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);

    // Deriva uma chave usando PBKDF2 com o salt
    const derivedKey = crypto.pbkdf2Sync(
      key,
      salt,
      100000,
      KEY_LENGTH,
      "sha256"
    );

    const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);
    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");

    const tag = cipher.getAuthTag();

    // Concatena: salt + iv + tag + encrypted
    const result = Buffer.concat([
      salt,
      iv,
      tag,
      Buffer.from(encrypted, "base64"),
    ]).toString("base64");

    return result;
  } catch (error) {
    logger.error("Erro ao criptografar texto", error);
    throw new Error("Falha ao criptografar dados");
  }
}

/**
 * Descriptografa um texto usando AES-256-GCM
 * @param encryptedText String base64 contendo: salt + iv + tag + encryptedData
 * @returns Texto descriptografado
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) {
    return "";
  }

  try {
    const key = getEncryptionKey();
    const data = Buffer.from(encryptedText, "base64");

    // Extrai salt, iv, tag e encrypted data
    const salt = data.subarray(0, SALT_LENGTH);
    const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = data.subarray(
      SALT_LENGTH + IV_LENGTH,
      SALT_LENGTH + IV_LENGTH + TAG_LENGTH
    );
    const encrypted = data.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

    // Deriva a mesma chave usando PBKDF2 com o salt
    const derivedKey = crypto.pbkdf2Sync(
      key,
      salt,
      100000,
      KEY_LENGTH,
      "sha256"
    );

    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, undefined, "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    logger.error("Erro ao descriptografar texto", error);
    throw new Error("Falha ao descriptografar dados");
  }
}
