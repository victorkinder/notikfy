import { Component, ErrorInfo, ReactNode } from "react";
import { Box, Typography, Button, Container } from "@mui/material";
import { ErrorOutline } from "@mui/icons-material";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Container maxWidth="sm">
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "100vh",
              textAlign: "center",
              gap: 2,
            }}
          >
            <ErrorOutline sx={{ fontSize: 64, color: "error.main" }} />
            <Typography variant="h4" component="h1" color="error">
              Algo deu errado
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {this.state.error?.message || "Ocorreu um erro inesperado"}
            </Typography>
            <Button variant="contained" onClick={this.handleReset}>
              Voltar ao início
            </Button>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}
