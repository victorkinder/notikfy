import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import {
  TikTokProfilesResponse,
  TikTokProfile,
} from "../types/tiktok-profile.types";
import {
  getTikTokProfiles as getTikTokProfilesService,
  addTikTokProfile as addTikTokProfileService,
  removeTikTokProfile as removeTikTokProfileService,
} from "../services/api/tiktok-profile.service";
import { useAuth } from "./AuthContext";
import { useActivation } from "./ActivationContext";
import { useNotification } from "../hooks/useNotification";
import {
  saveTikTokProfilesToIndexedDB,
  loadTikTokProfilesFromIndexedDB,
  clearTikTokProfilesFromIndexedDB,
} from "../services/storage/indexeddb.service";

interface TikTokProfileContextType {
  profiles: TikTokProfile[];
  profileLimit: number;
  currentCount: number;
  loading: boolean;
  error: string | null;
  refreshProfiles: () => Promise<void>;
  addProfile: (username: string) => Promise<void>;
  removeProfile: (username: string) => Promise<void>;
  canAddMore: boolean;
}

export const TikTokProfileContext = createContext<
  TikTokProfileContextType | undefined
>(undefined);

export const useTikTokProfiles = () => {
  const context = useContext(TikTokProfileContext);
  if (!context) {
    throw new Error(
      "useTikTokProfiles must be used within a TikTokProfileContextProvider"
    );
  }
  return context;
};

interface TikTokProfileContextProviderProps {
  children: ReactNode;
}

export const TikTokProfileContextProvider = ({
  children,
}: TikTokProfileContextProviderProps) => {
  const { user } = useAuth();
  const { activationStatus } = useActivation();
  const { showError: showErrorNotification } = useNotification();
  const [profilesResponse, setProfilesResponse] =
    useState<TikTokProfilesResponse | null>(null);
  const [loading, setLoading] = useState(false); // Não carrega automaticamente
  const [error, setError] = useState<string | null>(null);

  /**
   * Carrega perfis do cache local (IndexedDB) primeiro, depois sincroniza com backend
   */
  const refreshProfiles = useCallback(async () => {
    if (!user) {
      setProfilesResponse(null);
      setLoading(false);
      return;
    }

    // Só carrega se o usuário estiver ativado
    if (!activationStatus.isActivated) {
      // Limpa dados anteriores se não estiver ativado
      setProfilesResponse(null);
      setLoading(false);
      if (user.uid) {
        await clearTikTokProfilesFromIndexedDB(user.uid);
      }
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Tenta carregar do cache local primeiro
      if (user.uid) {
        const cachedData = await loadTikTokProfilesFromIndexedDB(user.uid);
        if (cachedData) {
          // Usa dados do cache enquanto busca do backend
          setProfilesResponse({
            profiles: cachedData.profiles.map((p) => ({
              username: p.username,
              createdAt: p.createdAt,
            })),
            profileLimit: cachedData.profileLimit,
            currentCount: cachedData.profiles.length,
          });
        }
      }

      // Sincroniza com backend
      const accessToken =
        activationStatus.activationData?.accessToken || undefined;
      const response = await getTikTokProfilesService(accessToken);
      setProfilesResponse(response);

      // Salva no IndexedDB para cache
      if (user.uid && response.profiles) {
        await saveTikTokProfilesToIndexedDB(
          user.uid,
          response.profiles.map((p) => ({
            username: p.username,
            createdAt: p.createdAt,
          })),
          response.profileLimit
        );
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao carregar perfis";
      setError(errorMessage);
      showErrorNotification(err, {
        duration: 7000,
      });
      console.error("Erro ao carregar perfis TikTok:", err);
    } finally {
      setLoading(false);
    }
  }, [user, activationStatus.isActivated, showErrorNotification]);

  // Carrega perfis apenas se usuário estiver autenticado E ativado
  useEffect(() => {
    if (user && activationStatus.isActivated) {
      refreshProfiles();
    } else {
      setProfilesResponse(null);
      setLoading(false);
    }
  }, [user, activationStatus.isActivated, refreshProfiles]);

  /**
   * Adiciona um novo perfil
   */
  const addProfile = useCallback(
    async (username: string) => {
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      try {
        setError(null);
        const accessToken =
          activationStatus.activationData?.accessToken || undefined;
        const newProfile = await addTikTokProfileService(
          username,
          accessToken
        );
        
        // Atualiza cache local imediatamente
        if (profilesResponse && user.uid) {
          const updatedProfiles = [
            ...profilesResponse.profiles,
            {
              username: newProfile.username,
              createdAt: newProfile.createdAt,
            },
          ];
          await saveTikTokProfilesToIndexedDB(
            user.uid,
            updatedProfiles,
            profilesResponse.profileLimit
          );
        }

        // Recarrega a lista de perfis após adicionar
        await refreshProfiles();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro ao adicionar perfil";
        setError(errorMessage);
        showErrorNotification(err, {
          duration: 7000,
        });
        throw err;
      }
    },
    [user, profilesResponse, refreshProfiles, showErrorNotification]
  );

  /**
   * Remove um perfil
   */
  const removeProfile = useCallback(
    async (username: string) => {
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      try {
        setError(null);
        await removeTikTokProfileService(username);
        
        // Atualiza cache local imediatamente
        if (profilesResponse && user.uid) {
          const updatedProfiles = profilesResponse.profiles.filter(
            (p) => p.username !== username
          );
          await saveTikTokProfilesToIndexedDB(
            user.uid,
            updatedProfiles.map((p) => ({
              username: p.username,
              createdAt: p.createdAt,
            })),
            profilesResponse.profileLimit
          );
        }

        // Recarrega a lista de perfis após remover
        await refreshProfiles();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro ao remover perfil";
        setError(errorMessage);
        showErrorNotification(err, {
          duration: 7000,
        });
        throw err;
      }
    },
    [user, profilesResponse, refreshProfiles, showErrorNotification]
  );

  const profiles = profilesResponse?.profiles || [];
  const profileLimit = profilesResponse?.profileLimit || 0;
  const currentCount = profilesResponse?.currentCount || 0;
  const canAddMore = currentCount < profileLimit;

  return (
    <TikTokProfileContext.Provider
      value={{
        profiles,
        profileLimit,
        currentCount,
        loading,
        error,
        refreshProfiles,
        addProfile,
        removeProfile,
        canAddMore,
      }}
    >
      {children}
    </TikTokProfileContext.Provider>
  );
};

