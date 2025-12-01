import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Box,
  Tooltip,
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";
import { TikTokProfile } from "../../types/tiktok-profile.types";

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
  const handleDelete = () => {
    if (
      window.confirm(
        `Tem certeza que deseja remover o perfil @${profile.username}?`
      )
    ) {
      onDelete(profile.username);
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
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            @{profile.username}
          </Typography>
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
      <Box sx={{ pr: 2 }}>
        <Tooltip title="Remover perfil">
          <IconButton
            color="error"
            onClick={handleDelete}
            disabled={deleting}
            aria-label={`Remover perfil @${profile.username}`}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Card>
  );
};

