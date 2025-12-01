import { Container, Typography } from "@mui/material";
import { Layout } from "../../components/layout/Layout/Layout";

export const Settings = () => {
  return (
    <Layout>
      <Container maxWidth="lg">
        <Typography variant="h4" component="h1" gutterBottom>
          Configurações
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Página de configurações em desenvolvimento
        </Typography>
      </Container>
    </Layout>
  );
};
