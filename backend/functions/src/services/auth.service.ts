import { auth } from "../config/firebase.config";
import { logger } from "../utils/logger";

/**
 * Revoga todos os tokens de um usuário pelo email
 */
export async function revokeUserTokens(email: string): Promise<void> {
  try {
    // Busca o usuário pelo email
    const user = await auth.getUserByEmail(email);

    // Revoga todos os refresh tokens do usuário
    // Isso força o usuário a fazer login novamente
    await auth.revokeRefreshTokens(user.uid);

    logger.info("Tokens do usuário revogados com sucesso", {
      email,
      uid: user.uid,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("not found")) {
      logger.warn("Usuário não encontrado para revogar tokens", { email });
      // Não lança erro se o usuário não existir
      return;
    }
    logger.error("Erro ao revogar tokens do usuário", error);
    throw error;
  }
}

/**
 * Revoga tokens de múltiplos usuários
 */
export async function revokeMultipleUserTokens(
  emails: string[]
): Promise<void> {
  const promises = emails.map((email) =>
    revokeUserTokens(email).catch((error) => {
      logger.error(`Erro ao revogar tokens para ${email}`, error);
      // Continua com os outros emails mesmo se um falhar
    })
  );

  await Promise.all(promises);
}
