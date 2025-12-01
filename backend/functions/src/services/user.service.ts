import { db } from "../config/firebase.config";
import { COLLECTIONS } from "../config/constants";
import {
  User,
  NotificationSettings,
  UpdateNotificationSettingsData,
  CreateUserData,
} from "../models/user.model";
import { NotFoundError, ValidationError } from "../utils/errors";
import { Timestamp } from "firebase-admin/firestore";
import { logger } from "../utils/logger";

/**
 * Valida as configurações de notificação
 */
function validateNotificationSettings(
  settings: UpdateNotificationSettingsData
): void {
  if (!settings.type) {
    throw new ValidationError("Tipo de notificação é obrigatório");
  }

  if (settings.type !== "sale" && settings.type !== "accumulated_commission") {
    throw new ValidationError(
      "Tipo de notificação deve ser 'sale' ou 'accumulated_commission'"
    );
  }

  if (settings.type === "accumulated_commission") {
    const validThresholds = [50, 100, 250, 500, 1000];
    if (
      !settings.accumulatedCommissionThreshold ||
      !validThresholds.includes(settings.accumulatedCommissionThreshold)
    ) {
      throw new ValidationError(
        "Threshold de comissão acumulada deve ser um dos valores: 50, 100, 250, 500, 1000"
      );
    }
  }
}

/**
 * Cria configurações padrão de notificação (tipo "sale")
 */
export function createDefaultNotificationSettings(): NotificationSettings {
  return {
    type: "sale",
  };
}

/**
 * Busca um usuário por UID
 */
export async function findUserByUid(uid: string): Promise<User | null> {
  const userDoc = await db.collection(COLLECTIONS.USUARIOS).doc(uid).get();

  if (!userDoc.exists) {
    return null;
  }

  return userDoc.data() as User;
}

/**
 * Cria um novo usuário com configurações padrão
 */
export async function createUser(data: CreateUserData): Promise<User> {
  const now = Timestamp.now();

  const defaultNotificationSettings = createDefaultNotificationSettings();

  const userData: User = {
    uid: data.uid,
    email: data.email,
    displayName: data.displayName,
    tiktok: {
      accessToken: "",
      webhookUrl: "",
      isValid: false,
    },
    telegram: {
      botToken: "",
      chatId: "",
      isConfigured: false,
    },
    notificationSettings: defaultNotificationSettings,
    accumulatedCommission: 0,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection(COLLECTIONS.USUARIOS).doc(data.uid).set(userData);

  logger.info("Usuário criado com sucesso", {
    uid: data.uid,
    email: data.email,
  });

  return userData;
}

/**
 * Obtém ou cria um usuário, garantindo que tenha configurações de notificação
 */
export async function getOrCreateUser(
  uid: string,
  email: string,
  displayName: string
): Promise<User> {
  let user = await findUserByUid(uid);

  if (!user) {
    // Cria novo usuário com configurações padrão
    user = await createUser({ uid, email, displayName });
  } else {
    // Garante que campos opcionais existam
    const updates: Partial<User> = {};
    let needsUpdate = false;

    if (!user.notificationSettings) {
      updates.notificationSettings = createDefaultNotificationSettings();
      needsUpdate = true;
    }

    if (user.accumulatedCommission === undefined) {
      updates.accumulatedCommission = 0;
      needsUpdate = true;
    }

    if (needsUpdate) {
      await db
        .collection(COLLECTIONS.USUARIOS)
        .doc(uid)
        .update({
          ...updates,
          updatedAt: Timestamp.now(),
        });
      user = {
        ...user,
        ...updates,
      };
      logger.info("Campos padrão adicionados ao usuário", { uid, updates });
    }
  }

  return user;
}

/**
 * Inicializa o campo accumulatedCommission se não existir
 */
export async function initializeAccumulatedCommission(
  userId: string
): Promise<void> {
  const user = await findUserByUid(userId);
  if (!user) {
    throw new NotFoundError("Usuário não encontrado");
  }

  if (user.accumulatedCommission === undefined) {
    await db.collection(COLLECTIONS.USUARIOS).doc(userId).update({
      accumulatedCommission: 0,
      updatedAt: Timestamp.now(),
    });
    logger.info("Campo accumulatedCommission inicializado", { userId });
  }
}

/**
 * Atualiza as configurações de notificação do usuário
 */
export async function updateNotificationSettings(
  userId: string,
  settings: UpdateNotificationSettingsData
): Promise<NotificationSettings> {
  // Valida os dados
  validateNotificationSettings(settings);

  // Verifica se o usuário existe
  const user = await findUserByUid(userId);
  if (!user) {
    throw new NotFoundError("Usuário não encontrado");
  }

  // Prepara as configurações de notificação
  const notificationSettings: NotificationSettings = {
    type: settings.type,
    ...(settings.type === "accumulated_commission" && {
      accumulatedCommissionThreshold: settings.accumulatedCommissionThreshold,
    }),
  };

  // Atualiza no Firestore
  await db.collection(COLLECTIONS.USUARIOS).doc(userId).update({
    notificationSettings,
    updatedAt: Timestamp.now(),
  });

  logger.info("Configurações de notificação atualizadas", {
    userId,
    type: settings.type,
  });

  return notificationSettings;
}
