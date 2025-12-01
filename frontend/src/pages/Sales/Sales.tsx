import { Container, Typography } from "@mui/material";
import { Layout } from "../../components/layout/Layout/Layout";

export const Sales = () => {
  return (
    <Layout>
      <Container maxWidth="lg">
        <Typography variant="h4" component="h1" gutterBottom>
          Vendas
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Página de vendas em desenvolvimento
        </Typography>
      </Container>
    </Layout>
  );
};
