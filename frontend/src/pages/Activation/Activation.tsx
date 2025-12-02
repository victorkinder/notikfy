import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Grid,
  Button,
} from "@mui/material";
import { ArrowUpward as UpgradeIcon } from "@mui/icons-material";
import { Layout } from "../../components/layout/Layout/Layout";
import { useActivation } from "../../context/ActivationContext";
import { ActivationKeyForm } from "../../components/forms/ActivationKeyForm";
import { PlanCard } from "../../components/plans/PlanCard";
import { PLANS, PlanId } from "../../types/activation.types";

export const Activation = () => {
  const navigate = useNavigate();
  const { activationStatus } = useActivation();

  const handleActivationSuccess = () => {
    // Redireciona para a página de vendas após ativação bem-sucedida
    navigate("/sales");
  };

  const handleUpgrade = () => {
    // Determina qual é o próximo plano baseado no plano atual
    const currentPlanId = activationStatus.activationData?.planId;
    let upgradePlanId: PlanId | null = null;

    if (currentPlanId === "STARTER") {
      upgradePlanId = "SCALING";
    } else if (currentPlanId === "SCALING") {
      upgradePlanId = "SCALED";
    }

    if (upgradePlanId) {
      const upgradePlan = PLANS[upgradePlanId];
      if (upgradePlan?.kiwifyUrl) {
        window.open(upgradePlan.kiwifyUrl, "_blank");
      }
    } else {
      // Se já está no plano mais alto, rola até a seção de planos
      const plansSection = document.getElementById("plans-section");
      if (plansSection) {
        plansSection.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  // Se já estiver ativado, mostra informações e botão de upgrade
  if (activationStatus.isActivated) {
    return (
      <Layout>
        <Container maxWidth="lg">
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Ativação
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Plano: {activationStatus.activationData?.planName}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<UpgradeIcon />}
              onClick={handleUpgrade}
              size="large"
              sx={{ textTransform: "none" }}
            >
              Realizar Upgrade
            </Button>
          </Box>
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

        <Box id="plans-section" sx={{ mt: 6 }}>
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
