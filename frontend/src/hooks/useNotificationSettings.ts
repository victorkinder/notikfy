import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase/config";
import { COLLECTIONS } from "../services/firebase/constants";
import { NotificationSettings } from "../types/user.types";
import { useAuth } from "../context/AuthContext";
import { updateNotificationSettings as updateSettings } from "../services/api/settings.service";

const DEFAULT_SETTINGS: NotificationSettings = {
  type: "sale",
};

/**
 * Hook para gerenciar configurações de notificação do usuário
 */
export const useNotificationSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Carrega configurações do usuário
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const userDocRef = doc(db, COLLECTIONS.USUARIOS, user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.notificationSettings) {
            setSettings(userData.notificationSettings as NotificationSettings);
          } else {
            setSettings(DEFAULT_SETTINGS);
          }
        } else {
          setSettings(DEFAULT_SETTINGS);
        }
      } catch (err) {
        console.error("Erro ao carregar configurações:", err);
        setError(err instanceof Error ? err.message : "Erro ao carregar configurações");
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  // Salva configurações
  const saveSettings = async (newSettings: NotificationSettings) => {
    if (!user) {
      throw new Error("Usuário não autenticado");
    }

    try {
      setSaving(true);
      setError(null);

      const updatedSettings = await updateSettings(newSettings);
      setSettings(updatedSettings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao salvar configurações";
      setError(errorMessage);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return {
    settings,
    loading,
    error,
    saving,
    saveSettings,
  };
};

