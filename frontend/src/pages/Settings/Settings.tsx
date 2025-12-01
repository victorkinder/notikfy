import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Paper,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
  Button,
  CircularProgress,
  Alert,
  Stack,
} from "@mui/material";
import { Layout } from "../../components/layout/Layout/Layout";
import { CommissionThresholdSlider } from "../../components/forms/CommissionThresholdSlider";
import { useNotificationSettings } from "../../hooks/useNotificationSettings";
import { useNotification } from "../../hooks/useNotification";
import { NotificationSettings } from "../../types/user.types";

export const Settings = () => {
  const { settings, loading, error, saving, saveSettings } =
    useNotificationSettings();
  const { showSuccess, showError } = useNotification();
  const [notificationType, setNotificationType] = useState<
    "sale" | "accumulated_commission"
  >("sale");
  const [threshold, setThreshold] = useState<number>(100);

  // Sincroniza estado local com configurações carregadas
  useEffect(() => {
    if (!loading && settings) {
      setNotificationType(settings.type);
      if (
        settings.type === "accumulated_commission" &&
        settings.accumulatedCommissionThreshold
      ) {
        setThreshold(settings.accumulatedCommissionThreshold);
      }
    }
  }, [settings, loading]);

  const handleTypeChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newType = event.target.value as "sale" | "accumulated_commission";
    setNotificationType(newType);
  };

  const handleThresholdChange = (value: number) => {
    setThreshold(value);
  };

  const handleSave = async () => {
    try {
      const newSettings: NotificationSettings = {
        type: notificationType,
        ...(notificationType === "accumulated_commission" && {
          accumulatedCommissionThreshold: threshold,
        }),
      };

      await saveSettings(newSettings);
      showSuccess("Configurações salvas com sucesso!");
    } catch (err) {
      showError(err);
    }
  };

  if (loading) {
    return (
      <Layout>
        <Container maxWidth="lg">
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="400px"
          >
            <CircularProgress />
          </Box>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="lg">
        <Typography variant="h4" component="h1" gutterBottom>
          Configurações
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
          Configure como deseja receber notificações
        </Typography>

        <Paper sx={{ p: 3 }}>
          <Stack spacing={3}>
            <FormControl component="fieldset">
              <FormLabel component="legend">
                <Typography variant="h6" gutterBottom>
                  Tipo de Notificação
                </Typography>
              </FormLabel>
              <RadioGroup
                value={notificationType}
                onChange={handleTypeChange}
                name="notification-type"
              >
                <FormControlLabel
                  value="sale"
                  control={<Radio />}
                  label="Notificação por venda"
                />
                <FormControlLabel
                  value="accumulated_commission"
                  control={<Radio />}
                  label="Notificação por Comissão Acumulada"
                />
              </RadioGroup>
            </FormControl>

            {notificationType === "accumulated_commission" && (
              <Box sx={{ mt: 2 }}>
                <CommissionThresholdSlider
                  value={threshold}
                  onChange={handleThresholdChange}
                  disabled={saving}
                />
              </Box>
            )}

            {error && <Alert severity="error">{error}</Alert>}

            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving}
                size="large"
                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : undefined}
              >
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </Box>
          </Stack>
        </Paper>
      </Container>
    </Layout>
  );
};
