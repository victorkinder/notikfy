import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useActivation } from "../../context/ActivationContext";
import { CircularProgress, Box } from "@mui/material";
import { useEffect, useState } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireActivation?: boolean;
}

export const ProtectedRoute = ({
  children,
  requireActivation = true,
}: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const {
    activationStatus,
    loading: activationLoading,
    validateTokenOnLogin,
  } = useActivation();
  const [validatingToken, setValidatingToken] = useState(false);

  // Valida token quando usuário faz login
  useEffect(() => {
    if (user && !authLoading && !activationLoading && !validatingToken) {
      setValidatingToken(true);
      validateTokenOnLogin()
        .then(() => {
          setValidatingToken(false);
        })
        .catch(() => {
          setValidatingToken(false);
        });
    }
  }, [user, authLoading, activationLoading, validateTokenOnLogin]);

  if (authLoading || activationLoading || validatingToken) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se a rota requer ativação e o usuário não está ativado, redireciona para /activation
  if (requireActivation && !activationStatus.isActivated) {
    return <Navigate to="/activation" replace />;
  }

  return <>{children}</>;
};
