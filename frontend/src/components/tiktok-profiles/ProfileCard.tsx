import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Box,
  Tooltip,
  Button,
  Chip,
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";
import { TikTokProfile } from "../../types/tiktok-profile.types";
import { initiateOAuth } from "../../services/api/tiktok-oauth.service";
import { useState } from "react";

interface ProfileCardProps {
  profile: TikTokProfile;
  onDelete: (username: string) => void;
  deleting?: boolean;
}

export const ProfileCard = ({
  profile,
  onDelete,
  deleting = false,
}: ProfileCardProps) => {
  const [connecting, setConnecting] = useState(false);
  const isConnected = profile.oauth?.isConnected === true;

  const handleDelete = () => {
    if (
      window.confirm(
        `Tem certeza que deseja remover o perfil @${profile.username}?`
      )
    ) {
      onDelete(profile.username);
    }
  };

  const handleConnect = async () => {
    try {
      setConnecting(true);
      await initiateOAuth(profile.username);
      // O redirecionamento será feito pelo serviço
    } catch (error) {
      console.error("Erro ao iniciar conexão OAuth:", error);
      // TODO: Mostrar toast de erro
    } finally {
      setConnecting(false);
    }
  };

  return (
    <Card
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: 3,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, "&:last-child": { pb: 2 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            @{profile.username}
          </Typography>
          {isConnected && (
            <Chip
              label="Conectado"
              color="success"
              size="small"
              sx={{ height: 24, fontSize: "0.75rem" }}
            />
          )}
        </Box>
        <Typography variant="caption" color="text.secondary">
          Adicionado em{" "}
          {profile.createdAt
            ? new Date(profile.createdAt).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })
            : "Data não disponível"}
        </Typography>
      </CardContent>
      <Box sx={{ pr: 2, display: "flex", alignItems: "center", gap: 1 }}>
        {!isConnected ? (
          <Button
            variant="outlined"
            size="small"
            onClick={handleConnect}
            disabled={connecting || deleting}
            sx={{ textTransform: "none" }}
          >
            {connecting ? "Conectando..." : "Conectar TikTok"}
          </Button>
        ) : null}
        <Tooltip title="Remover perfil">
          <IconButton
            color="error"
            onClick={handleDelete}
            disabled={deleting || connecting}
            aria-label={`Remover perfil @${profile.username}`}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Card>
  );
};

