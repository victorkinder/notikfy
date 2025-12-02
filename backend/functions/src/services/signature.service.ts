import { db } from "../config/firebase.config";
import { COLLECTIONS } from "../config/constants";
import {
  Signature,
  CreateSignatureData,
  SignatureStatus,
} from "../models/signature.model";
import { PLANS } from "../models/activation.model";
import { NotFoundError, ValidationError } from "../utils/errors";
import { Timestamp } from "firebase-admin/firestore";
import { logger } from "../utils/logger";

/**
 * Gera um access_token curto (8-12 caracteres alfanuméricos)
 * Usa apenas letras maiúsculas e números para facilitar digitação
 */
export function generateAccessToken(): string {
  // Gera 6 bytes (48 bits) e converte para base36 (0-9, a-z)
  // Remove caracteres ambíguos (0, O, I, l) para facilitar digitação
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let token = "";

  // Gera token de 10 caracteres (bom equilíbrio entre segurança e usabilidade)
  for (let i = 0; i < 10; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    token += chars[randomIndex];
  }

  return token;
}

/**
 * Verifica se um access_token já existe
 */
async function accessTokenExists(token: string): Promise<boolean> {
  const snapshot = await db
    .collection(COLLECTIONS.SIGNATURES)
    .where("access_token", "==", token)
    .limit(1)
    .get();

  return !snapshot.empty;
}

/**
 * Gera um access_token único
 */
export async function generateUniqueAccessToken(): Promise<string> {
  let token = generateAccessToken();
  let attempts = 0;
  const maxAttempts = 10;

  while ((await accessTokenExists(token)) && attempts < maxAttempts) {
    token = generateAccessToken();
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new Error(
      "Não foi possível gerar um access_token único após várias tentativas"
    );
  }

  return token;
}

/**
 * Cria uma nova assinatura
 */
export async function createSignature(
  data: CreateSignatureData
): Promise<Signature> {
  if (!data.email || !data.email.trim()) {
    throw new ValidationError("Email é obrigatório");
  }

  if (!data.planId || !PLANS[data.planId]) {
    throw new ValidationError("ID do plano inválido");
  }

  const email = data.email.toLowerCase().trim();

  // Verifica se já existe assinatura para este email
  const existing = await findSignatureByEmail(email);
  if (existing) {
    throw new ValidationError("Já existe uma assinatura para este email");
  }

  // Gera access_token único
  const accessToken = await generateUniqueAccessToken();

  // Calcula datas
  const now = new Date();
  const initialDate = data.initialDate || now;

  // Define final_date como 30 dias a partir de initial_date (ajustar conforme necessário)
  const finalDate =
    data.finalDate ||
    new Date(initialDate.getTime() + 30 * 24 * 60 * 60 * 1000);

  const plan = PLANS[data.planId];

  const signatureData: Signature = {
    email,
    initial_date: Timestamp.fromDate(initialDate),
    final_date: Timestamp.fromDate(finalDate),
    update_date: Timestamp.now(),
    status: "active",
    plan: {
      id: data.planId,
      name: data.planName || plan.name,
    },
    access_token: accessToken,
    kiwify_order_id: data.kiwifyOrderId,
    kiwify_customer_id: data.kiwifyCustomerId,
  };

  await db.collection(COLLECTIONS.SIGNATURES).doc(email).set(signatureData);

  logger.info("Assinatura criada com sucesso", { email, planId: data.planId });

  return signatureData;
}

/**
 * Busca assinatura por email
 */
export async function findSignatureByEmail(
  email: string
): Promise<Signature | null> {
  const normalizedEmail = email.toLowerCase().trim();
  const doc = await db
    .collection(COLLECTIONS.SIGNATURES)
    .doc(normalizedEmail)
    .get();

  if (!doc.exists) {
    return null;
  }

  return doc.data() as Signature;
}

/**
 * Busca assinatura por access_token
 */
export async function findSignatureByToken(
  token: string
): Promise<Signature | null> {
  const snapshot = await db
    .collection(COLLECTIONS.SIGNATURES)
    .where("access_token", "==", token)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].data() as Signature;
}

/**
 * Atualiza o status da assinatura
 */
export async function updateSignatureStatus(
  email: string,
  status: SignatureStatus
): Promise<Signature> {
  const normalizedEmail = email.toLowerCase().trim();
  const signatureRef = db
    .collection(COLLECTIONS.SIGNATURES)
    .doc(normalizedEmail);
  const signatureDoc = await signatureRef.get();

  if (!signatureDoc.exists) {
    throw new NotFoundError("Assinatura não encontrada");
  }

  await signatureRef.update({
    status,
    update_date: Timestamp.now(),
  });

  const updated = await signatureRef.get();
  const updatedData = updated.data() as Signature;

  logger.info("Status da assinatura atualizado", { email, status });

  return updatedData;
}

/**
 * Verifica se uma assinatura está ativa e válida
 */
export async function isSignatureValid(email: string): Promise<boolean> {
  const signature = await findSignatureByEmail(email);

  if (!signature) {
    return false;
  }

  if (signature.status !== "active") {
    return false;
  }

  // Verifica se a assinatura não expirou
  const now = Timestamp.now();
  if (signature.final_date < now) {
    return false;
  }

  return true;
}

/**
 * Busca userId pelo access_token
 */
export async function findUserIdByAccessToken(
  accessToken: string
): Promise<string | null> {
  const signature = await findSignatureByToken(accessToken);
  return signature?.userId || null;
}

/**
 * Vincula access_token ao userId
 */
export async function linkAccessTokenToUserId(
  accessToken: string,
  userId: string
): Promise<void> {
  if (!accessToken || !accessToken.trim()) {
    throw new ValidationError("Access token é obrigatório");
  }

  if (!userId || !userId.trim()) {
    throw new ValidationError("User ID é obrigatório");
  }

  const signature = await findSignatureByToken(accessToken);

  if (!signature) {
    throw new NotFoundError("Assinatura não encontrada para este access token");
  }

  // Se já tiver userId vinculado e for diferente, não permite alteração
  if (signature.userId && signature.userId !== userId) {
    throw new ValidationError(
      "Este access token já está vinculado a outro usuário"
    );
  }

  // Atualiza apenas se não tiver userId ou se for o mesmo
  if (!signature.userId) {
    await db.collection(COLLECTIONS.SIGNATURES).doc(signature.email).update({
      userId: userId,
      update_date: Timestamp.now(),
    });

    logger.info("Access token vinculado ao userId", {
      accessToken,
      userId,
      email: signature.email,
    });
  }
}
