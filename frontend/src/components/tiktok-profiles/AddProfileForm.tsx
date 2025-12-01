import { useState } from "react";
import {
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  Stack,
  CircularProgress,
  InputAdornment,
} from "@mui/material";
import { useTikTokProfiles } from "../../context/TikTokProfileContext";
import { useNotification } from "../../hooks/useNotification";

export const AddProfileForm = () => {
  const { addProfile, loading, canAddMore, profileLimit, currentCount } =
    useTikTokProfiles();
  const { showSuccess, showError } = useNotification();
  const [username, setUsername] = useState("");

  // Normaliza o username (remove @ se presente)
  const normalizeUsername = (value: string): string => {
    return value.replace(/^@/, "").trim();
  };

  // Valida formato do username
  const validateUsername = (value: string): boolean => {
    const normalized = normalizeUsername(value);
    if (!normalized || normalized.length < 2 || normalized.length > 24) {
      return false;
    }
    // Apenas letras, números, underscore e pontos
    const usernameRegex = /^[a-zA-Z0-9._]+$/;
    return usernameRegex.test(normalized);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedUsername = normalizeUsername(username);

    if (!normalizedUsername) {
      showError("Por favor, informe o username do TikTok");
      return;
    }

    if (!validateUsername(username)) {
      showError(
        "Username inválido. Use apenas letras, números, underscore (_) e pontos (.). Entre 2 e 24 caracteres."
      );
      return;
    }

    if (!canAddMore) {
      showError(
        `Limite de perfis atingido. Seu plano permite ${profileLimit} perfil(is).`
      );
      return;
    }

    try {
      await addProfile(normalizedUsername);
      const successMessage = `Perfil @${normalizedUsername} adicionado com sucesso!`;
      showSuccess(successMessage);
      setUsername("");
    } catch (err) {
      // Erro já é mostrado via notificação no context
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    // Remove @ no início se o usuário digitar
    value = value.replace(/^@+/, "");
    setUsername(value);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Adicionar Novo Perfil
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Você pode adicionar até {profileLimit} perfil(is). Atualmente você tem{" "}
        {currentCount} de {profileLimit} perfil(is) cadastrado(s).
      </Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <Stack spacing={2}>
          <TextField
            fullWidth
            label="Username do TikTok"
            placeholder="perfil1"
            value={username}
            onChange={handleInputChange}
            disabled={loading || !canAddMore}
            autoFocus
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">@</InputAdornment>
              ),
            }}
            helperText={
              !canAddMore
                ? `Limite de perfis atingido (${profileLimit}/${profileLimit})`
                : "Digite o username sem o @"
            }
            error={!canAddMore}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading || !username.trim() || !canAddMore}
            size="large"
            startIcon={
              loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : undefined
            }
          >
            {loading ? "Adicionando..." : "Adicionar Perfil"}
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
};

