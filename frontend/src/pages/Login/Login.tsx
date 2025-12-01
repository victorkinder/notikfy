import { Container, Typography, Box } from "@mui/material";
import { Navigate } from "react-router-dom";
import { Header } from "../../components/layout/Header/Header";
import { GoogleLoginButton } from "./GoogleLoginButton";
import { useAuth } from "../../context/AuthContext";

export const Login = () => {
  const { user, loading } = useAuth();

  // Se já estiver logado, redireciona para o dashboard
  if (loading) {
    return null; // Ou um loading spinner
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <Header />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "calc(100vh - 64px)",
          padding: 3,
        }}
      >
        <Container maxWidth="sm">
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
            }}
          >
            <Typography
              variant="h4"
              component="h1"
              textAlign="center"
              sx={{
                fontFamily:
                  '"TikTok Sans", "Roboto", "Helvetica", "Arial", sans-serif',
                fontWeight: 700,
              }}
            >
              Log in to NoTikFy
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              textAlign="center"
              sx={{ maxWidth: 400 }}
            >
              Manage your accounts and receive sales notifications.
            </Typography>
            <GoogleLoginButton />
          </Box>
        </Container>
      </Box>
    </>
  );
};
