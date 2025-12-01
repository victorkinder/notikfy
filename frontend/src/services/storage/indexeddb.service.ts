/**
 * Serviço para gerenciamento de IndexedDB
 * Utilizado para cache local de dados e evitar consultas desnecessárias ao backend
 */

const DB_NAME = "notikfy_db";
const DB_VERSION = 1;

/**
 * Stores do IndexedDB
 */
const STORES = {
  TIKTOK_PROFILES: "tiktokProfiles",
} as const;

interface TikTokProfilesData {
  userId: string;
  profiles: Array<{
    username: string;
    createdAt: string;
  }>;
  profileLimit: number;
  lastUpdated: number; // timestamp
}

/**
 * Inicializa o banco de dados IndexedDB
 */
function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("Erro ao abrir IndexedDB"));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Cria store de perfis TikTok se não existir
      if (!db.objectStoreNames.contains(STORES.TIKTOK_PROFILES)) {
        const store = db.createObjectStore(STORES.TIKTOK_PROFILES, {
          keyPath: "userId",
        });
        store.createIndex("lastUpdated", "lastUpdated", { unique: false });
      }
    };
  });
}

/**
 * Salva perfis do TikTok no IndexedDB
 */
export async function saveTikTokProfilesToIndexedDB(
  userId: string,
  profiles: Array<{ username: string; createdAt: string }>,
  profileLimit: number
): Promise<void> {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.TIKTOK_PROFILES], "readwrite");
    const store = transaction.objectStore(STORES.TIKTOK_PROFILES);

    const data: TikTokProfilesData = {
      userId,
      profiles,
      profileLimit,
      lastUpdated: Date.now(),
    };

    await new Promise<void>((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();
  } catch (error) {
    console.error("Erro ao salvar perfis no IndexedDB:", error);
    // Não lança erro - cache é opcional
  }
}

/**
 * Carrega perfis do TikTok do IndexedDB
 */
export async function loadTikTokProfilesFromIndexedDB(
  userId: string
): Promise<{
  profiles: Array<{ username: string; createdAt: string }>;
  profileLimit: number;
} | null> {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.TIKTOK_PROFILES], "readonly");
    const store = transaction.objectStore(STORES.TIKTOK_PROFILES);

    const data = await new Promise<TikTokProfilesData | null>(
      (resolve, reject) => {
        const request = store.get(userId);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      }
    );

    db.close();

    if (!data) {
      return null;
    }

    return {
      profiles: data.profiles,
      profileLimit: data.profileLimit,
    };
  } catch (error) {
    console.error("Erro ao carregar perfis do IndexedDB:", error);
    return null;
  }
}

/**
 * Remove perfis do TikTok do IndexedDB
 */
export async function clearTikTokProfilesFromIndexedDB(
  userId: string
): Promise<void> {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.TIKTOK_PROFILES], "readwrite");
    const store = transaction.objectStore(STORES.TIKTOK_PROFILES);

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(userId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();
  } catch (error) {
    console.error("Erro ao limpar perfis do IndexedDB:", error);
    // Não lança erro - cache é opcional
  }
}

/**
 * Verifica se há cache válido (menos de X minutos)
 */
export async function isTikTokProfilesCacheValid(
  userId: string,
  maxAgeMinutes: number = 5
): Promise<boolean> {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.TIKTOK_PROFILES], "readonly");
    const store = transaction.objectStore(STORES.TIKTOK_PROFILES);

    const data = await new Promise<TikTokProfilesData | null>(
      (resolve, reject) => {
        const request = store.get(userId);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      }
    );

    db.close();

    if (!data) {
      return false;
    }

    const age = Date.now() - data.lastUpdated;
    const maxAge = maxAgeMinutes * 60 * 1000;
    return age < maxAge;
  } catch (error) {
    console.error("Erro ao verificar cache:", error);
    return false;
  }
}

