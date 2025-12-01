import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Grid,
  Alert,
} from "@mui/material";
import { Layout } from "../../components/layout/Layout/Layout";
import { useActivation } from "../../context/ActivationContext";
import { ActivationKeyForm } from "../../components/forms/ActivationKeyForm";
import { PlanCard } from "../../components/plans/PlanCard";
import { PLANS } from "../../types/activation.types";

export const Activation = () => {
  const navigate = useNavigate();
  const { activationStatus } = useActivation();

  const handleActivationSuccess = () => {
    // Redireciona para a página de vendas após ativação bem-sucedida
    navigate("/sales");
  };

  // Se já estiver ativado, mostra mensagem
  if (activationStatus.isActivated) {
    return (
      <Layout>
        <Container maxWidth="lg">
          <Alert severity="success" sx={{ mb: 3 }}>
            Sua conta já está ativada! Você pode acessar todas as funcionalidades.
          </Alert>
          <Typography variant="h4" component="h1" gutterBottom>
            Ativação
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Plano: {activationStatus.activationData?.planName}
          </Typography>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Ative sua conta
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Digite seu código de ativação recebido por email após a compra na
            Kiwify
          </Typography>
        </Box>

        <Box sx={{ mb: 6, maxWidth: 600, mx: "auto" }}>
          <ActivationKeyForm onSuccess={handleActivationSuccess} />
        </Box>

        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" component="h2" gutterBottom align="center">
            Escolha o plano ideal para você
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ mb: 4 }}
          >
            Após a compra, você receberá um código de ativação por email
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <PlanCard plan={PLANS.STARTER} />
            </Grid>
            <Grid item xs={12} md={4}>
              <PlanCard plan={PLANS.SCALING} />
            </Grid>
            <Grid item xs={12} md={4}>
              <PlanCard plan={PLANS.SCALED} />
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Layout>
  );
};
