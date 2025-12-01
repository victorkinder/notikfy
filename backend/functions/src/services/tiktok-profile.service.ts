import { db, auth } from "../config/firebase.config";
import { COLLECTIONS } from "../config/constants";
import {
  TikTokProfile,
  TikTokProfilesResponse,
  TikTokProfileResponse,
} from "../models/tiktok-profile.model";
import { PlanId } from "../models/activation.model";
import { NotFoundError, ValidationError } from "../utils/errors";
import { Timestamp } from "firebase-admin/firestore";
import { logger } from "../utils/logger";
import {
  findSignatureByEmail,
  findSignatureByToken,
} from "./signature.service";
import {
  User as UserModel,
  TikTokConfig,
  TelegramConfig,
} from "../models/user.model";
// Importa o arquivo JSON de configuração
// O TypeScript com resolveJsonModule habilita import direto de JSON
import signatureConfig from "../config/signature_config.json";

/**
 * Interface para configuração de assinatura
 */
interface SignatureConfig {
  id: PlanId;
  profileLimit: number;
}

/**
 * Carrega configuração de assinaturas do arquivo JSON
 */
function loadSignatureConfig(): SignatureConfig[] {
  try {
    return signatureConfig as SignatureConfig[];
  } catch (error) {
    logger.error("Erro ao carregar signature_config.json", error);
    // Retorna valores padrão caso não consiga carregar
    return [
      { id: "STARTER", profileLimit: 5 },
      { id: "SCALING", profileLimit: 10 },
      { id: "SCALED", profileLimit: 999 },
    ];
  }
}

/**
 * Obtém o limite de perfis para um plano específico
 */
export function getProfileLimitByPlan(planId: PlanId): number {
  const config = loadSignatureConfig();
  const planConfig = config.find((c) => c.id === planId);

  if (!planConfig) {
    logger.warn("Plano não encontrado no config, usando limite padrão", {
      planId,
    });
    // Retorna limite padrão baseado nos planos conhecidos
    switch (planId) {
      case "STARTER":
        return 5;
      case "SCALING":
        return 10;
      case "SCALED":
        return 999;
      default:
        return 5;
    }
  }

  return planConfig.profileLimit;
}

/**
 * Obtém o planId do usuário através do email (busca na assinatura)
 */
async function getUserPlanId(userEmail: string): Promise<PlanId | null> {
  try {
    const signature = await findSignatureByEmail(userEmail);
    if (!signature || signature.status !== "active") {
      return null;
    }
    return signature.plan.id;
  } catch (error) {
    logger.error("Erro ao buscar plano do usuário", { userEmail, error });
    return null;
  }
}

/**
 * Busca o plano do usuário usando o accessToken de ativação
 */
async function getUserPlanIdByToken(
  accessToken: string
): Promise<PlanId | null> {
  try {
    const signature = await findSignatureByToken(accessToken);
    if (!signature || signature.status !== "active") {
      return null;
    }
    return signature.plan.id;
  } catch (error) {
    logger.error("Erro ao buscar plano por accessToken", {
      accessToken,
      error,
    });
    return null;
  }
}

/**
 * Normaliza o username do TikTok (remove @ se presente, converte para lowercase)
 */
function normalizeTikTokUsername(username: string): string {
  return username.replace(/^@/, "").trim().toLowerCase();
}

/**
 * Valida formato do username do TikTok
 */
function validateTikTokUsername(username: string): void {
  const normalized = normalizeTikTokUsername(username);

  if (!normalized || normalized.length === 0) {
    throw new ValidationError("Username do TikTok é obrigatório");
  }

  if (normalized.length < 2 || normalized.length > 24) {
    throw new ValidationError(
      "Username do TikTok deve ter entre 2 e 24 caracteres"
    );
  }

  // Valida formato: apenas letras, números, underscore e pontos
  const usernameRegex = /^[a-z0-9._]+$/;
  if (!usernameRegex.test(normalized)) {
    throw new ValidationError(
      "Username do TikTok pode conter apenas letras, números, underscore (_) e pontos (.)"
    );
  }
}

/**
 * Converte um perfil TikTok com Timestamp para formato de resposta (string ISO)
 */
function convertProfileToResponse(
  profile: TikTokProfile
): TikTokProfileResponse {
  return {
    username: profile.username,
    createdAt:
      profile.createdAt instanceof Timestamp
        ? profile.createdAt.toDate().toISOString()
        : typeof profile.createdAt === "string"
          ? profile.createdAt
          : new Date().toISOString(), // Fallback
  };
}

/**
 * Obtém todos os perfis do TikTok de um usuário
 * Retorna array vazio se o usuário não existir (situação normal antes da ativação)
 */
export async function getUserTikTokProfiles(
  userId: string,
  userEmail: string,
  activationAccessToken?: string
): Promise<TikTokProfilesResponse> {
  if (!userId || !userId.trim()) {
    throw new ValidationError("ID do usuário é obrigatório");
  }

  const userRef = db.collection(COLLECTIONS.USUARIOS).doc(userId);
  const userDoc = await userRef.get();

  // Se o usuário não existe, retorna array vazio (situação normal antes da ativação)
  if (!userDoc.exists) {
    // Obtém o plano para retornar o limite correto, mesmo sem documento do usuário
    // Usa accessToken se fornecido, caso contrário tenta pelo email
    const planId = activationAccessToken
      ? await getUserPlanIdByToken(activationAccessToken)
      : await getUserPlanId(userEmail);
    const profileLimit = planId ? getProfileLimitByPlan(planId) : 0;

    logger.info(
      "Documento do usuário não existe ainda (normal antes da ativação)",
      {
        userId,
        email: userEmail,
      }
    );

    return {
      profiles: [],
      profileLimit,
      currentCount: 0,
    };
  }

  const userData = userDoc.data();
  const profiles: TikTokProfile[] = userData?.tiktokProfiles || [];

  // Obtém o plano do usuário para retornar o limite
  // Usa accessToken se fornecido, caso contrário tenta pelo email
  const planId = activationAccessToken
    ? await getUserPlanIdByToken(activationAccessToken)
    : await getUserPlanId(userEmail);
  const profileLimit = planId ? getProfileLimitByPlan(planId) : 0;

  // Converte Timestamps para string ISO para serialização JSON
  const profilesWithStringDates = profiles.map(convertProfileToResponse);

  return {
    profiles: profilesWithStringDates,
    profileLimit,
    currentCount: profiles.length,
  };
}

/**
 * Adiciona um novo perfil do TikTok ao usuário
 */
export async function addTikTokProfile(
  userId: string,
  userEmail: string,
  username: string,
  activationAccessToken?: string
): Promise<TikTokProfileResponse> {
  if (!userId || !userId.trim()) {
    throw new ValidationError("ID do usuário é obrigatório");
  }

  // Valida formato do username
  validateTikTokUsername(username);
  const normalizedUsername = normalizeTikTokUsername(username);

  // Obtém o plano do usuário
  // Usa accessToken se fornecido, caso contrário tenta pelo email
  const planId = activationAccessToken
    ? await getUserPlanIdByToken(activationAccessToken)
    : await getUserPlanId(userEmail);
  if (!planId) {
    throw new ValidationError(
      "Usuário não possui assinatura ativa. Ative sua conta primeiro."
    );
  }

  const profileLimit = getProfileLimitByPlan(planId);

  // Verifica se o documento do usuário existe, se não, busca dados do Firebase Auth
  const userRef = db.collection(COLLECTIONS.USUARIOS).doc(userId);
  const userDocCheck = await userRef.get();

  // Se não existe, busca informações do Firebase Auth antes da transação
  let userRecord = null;
  if (!userDocCheck.exists) {
    try {
      userRecord = await auth.getUser(userId);
    } catch (error) {
      logger.warn("Não foi possível buscar dados do usuário no Firebase Auth", {
        userId,
        error,
      });
    }
  }

  // Usa transação para garantir consistência
  return await db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);

    // Se o documento não existe, cria com estrutura inicial
    if (!userDoc.exists) {
      // Cria documento do usuário com estrutura inicial
      const defaultTikTokConfig: TikTokConfig = {
        accessToken: "",
        webhookUrl: "",
        isValid: false,
      };

      const defaultTelegramConfig: TelegramConfig = {
        botToken: "",
        chatId: "",
        isConfigured: false,
      };

      const newUserData: Omit<UserModel, "tiktokProfiles"> = {
        uid: userId,
        email: userEmail || userRecord?.email || "",
        displayName:
          userRecord?.displayName ||
          userRecord?.email?.split("@")[0] ||
          "Usuário",
        tiktok: defaultTikTokConfig,
        telegram: defaultTelegramConfig,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      transaction.set(userRef, {
        ...newUserData,
        tiktokProfiles: [],
      });

      logger.info(
        "Documento do usuário criado automaticamente ao adicionar perfil",
        {
          userId,
          email: userEmail,
        }
      );
    }

    const userData = userDoc.exists ? userDoc.data() : null;
    const currentProfiles: TikTokProfile[] = userData?.tiktokProfiles || [];

    // Verifica se já existe o perfil
    const existingProfile = currentProfiles.find(
      (p) => p.username.toLowerCase() === normalizedUsername
    );
    if (existingProfile) {
      throw new ValidationError(
        `O perfil @${normalizedUsername} já está cadastrado`
      );
    }

    // Verifica limite
    if (currentProfiles.length >= profileLimit) {
      throw new ValidationError(
        `Limite de perfis atingido. Seu plano permite ${profileLimit} perfil(is).`
      );
    }

    // Cria novo perfil
    const newProfile: TikTokProfile = {
      username: normalizedUsername,
      createdAt: Timestamp.now(),
    };

    // Adiciona o perfil ao array
    const updatedProfiles = [...currentProfiles, newProfile];

    // Atualiza o documento
    transaction.update(userRef, {
      tiktokProfiles: updatedProfiles,
      updatedAt: Timestamp.now(),
    });

    logger.info("Perfil TikTok adicionado com sucesso", {
      userId,
      username: normalizedUsername,
    });

    // Converte para formato de resposta (string ISO)
    return convertProfileToResponse(newProfile);
  });
}

/**
 * Remove um perfil do TikTok do usuário
 */
export async function removeTikTokProfile(
  userId: string,
  username: string
): Promise<void> {
  if (!userId || !userId.trim()) {
    throw new ValidationError("ID do usuário é obrigatório");
  }

  validateTikTokUsername(username);
  const normalizedUsername = normalizeTikTokUsername(username);

  // Usa transação para garantir consistência
  await db.runTransaction(async (transaction) => {
    const userRef = db.collection(COLLECTIONS.USUARIOS).doc(userId);
    const userDoc = await transaction.get(userRef);

    if (!userDoc.exists) {
      throw new NotFoundError("Usuário não encontrado");
    }

    const userData = userDoc.data();
    const currentProfiles: TikTokProfile[] = userData?.tiktokProfiles || [];

    // Verifica se o perfil existe
    const profileIndex = currentProfiles.findIndex(
      (p) => p.username.toLowerCase() === normalizedUsername
    );

    if (profileIndex === -1) {
      throw new NotFoundError(`Perfil @${normalizedUsername} não encontrado`);
    }

    // Remove o perfil do array
    const updatedProfiles = currentProfiles.filter(
      (_, index) => index !== profileIndex
    );

    // Atualiza o documento
    transaction.update(userRef, {
      tiktokProfiles: updatedProfiles,
      updatedAt: Timestamp.now(),
    });

    logger.info("Perfil TikTok removido com sucesso", {
      userId,
      username: normalizedUsername,
    });
  });
}
