import { useState } from "react";
import {
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  Stack,
  CircularProgress,
} from "@mui/material";
import { useActivation } from "../../context/ActivationContext";
import { useNotification } from "../../hooks/useNotification";

interface ActivationKeyFormProps {
  onSuccess?: () => void;
}

export const ActivationKeyForm = ({ onSuccess }: ActivationKeyFormProps) => {
  const { activate, loading } = useActivation();
  const { showSuccess, showError } = useNotification();
  const [key, setKey] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!key.trim()) {
      showError(new Error("Por favor, informe o código de ativação"));
      return;
    }

    try {
      await activate(key.trim());
      const successMessage = "Código de ativação validado com sucesso!";
      showSuccess(successMessage);
      setKey("");
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err) {
      showError(err);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom align="center">
        Já possui um código de ativação?
      </Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <Stack spacing={2}>
          <TextField
            fullWidth
            label="Código de ativação"
            placeholder="Digite seu código de ativação"
            value={key}
            onChange={(e) => setKey(e.target.value.toUpperCase())}
            disabled={loading}
            autoFocus
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading || !key.trim()}
            size="large"
            startIcon={
              loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : undefined
            }
          >
            {loading ? "Ativando..." : "Ativar"}
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
};
