import { Container, Typography, Box, Paper, Grid } from "@mui/material";
import { Layout } from "../../components/layout/Layout/Layout";

export const Dashboard = () => {
  return (
    <Layout>
      <Container maxWidth="lg">
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6} lg={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Vendas Hoje
              </Typography>
              <Typography variant="h4">0</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Total de Vendas
              </Typography>
              <Typography variant="h4">0</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Notificações Enviadas
              </Typography>
              <Typography variant="h4">0</Typography>
            </Paper>
          </Grid>
        </Grid>
        <Box sx={{ marginTop: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Atividades Recentes
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Nenhuma atividade recente
            </Typography>
          </Paper>
        </Box>
      </Container>
    </Layout>
  );
};
