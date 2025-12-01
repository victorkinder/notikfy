import {
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Divider,
} from "@mui/material";
import { CheckCircle as CheckIcon } from "@mui/icons-material";
import { Plan } from "../../types/activation.types";

interface PlanCardProps {
  plan: Plan;
  kiwifyUrl?: string; // URL do produto na Kiwify (opcional)
}

export const PlanCard = ({ plan, kiwifyUrl }: PlanCardProps) => {
  const handlePurchase = () => {
    const url = kiwifyUrl || plan.kiwifyUrl;
    if (url) {
      window.open(url, "_blank");
    } else {
      // Se não houver URL, pode mostrar uma mensagem ou redirecionar para página de planos
      alert("Link de compra não configurado. Entre em contato com o suporte.");
    }
  };

  return (
    <Paper
      sx={{
        p: 3,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: 4,
        },
      }}
    >
      <Box sx={{ textAlign: "center", mb: 2 }}>
        <Typography variant="h5" component="h3" gutterBottom>
          {plan.name}
        </Typography>
        <Box sx={{ my: 2 }}>
          <Typography
            variant="h4"
            component="div"
            sx={{ fontWeight: 700, color: "success.main" }}
          >
            R$ {plan.price}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            /mês
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Conecte até {plan.maxAccounts === 999 ? "10+" : plan.maxAccounts}{" "}
          contas do TikTok
        </Typography>
      </Box>
      <Divider sx={{ my: 2 }} />
      <List sx={{ flexGrow: 1, py: 0 }}>
        {plan.features.map((feature, index) => (
          <ListItem key={index} disablePadding sx={{ py: 1 }}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <CheckIcon color="success" />
            </ListItemIcon>
            <ListItemText
              primary={feature}
              primaryTypographyProps={{
                variant: "body2",
              }}
            />
          </ListItem>
        ))}
      </List>
      <Button
        variant="contained"
        fullWidth
        onClick={handlePurchase}
        sx={{ mt: 2 }}
        size="large"
      >
        Obter Código
      </Button>
    </Paper>
  );
};
