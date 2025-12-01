import {
  Container,
  Typography,
  Box,
  Grid,
  CircularProgress,
  Alert,
  Stack,
} from "@mui/material";
import { Layout } from "../../components/layout/Layout/Layout";
import { useTikTokProfiles } from "../../context/TikTokProfileContext";
import { ProfileCard } from "../../components/tiktok-profiles/ProfileCard";
import { AddProfileForm } from "../../components/tiktok-profiles/AddProfileForm";
import { useNotification } from "../../hooks/useNotification";
import { useState } from "react";

export const TikTokProfiles = () => {
  const {
    profiles,
    loading,
    error: contextError,
    removeProfile,
    profileLimit,
    currentCount,
    canAddMore,
  } = useTikTokProfiles();
  const { showSuccess } = useNotification();
  const [deletingUsernames, setDeletingUsernames] = useState<Set<string>>(
    new Set()
  );

  const handleDelete = async (username: string) => {
    setDeletingUsernames((prev) => new Set(prev).add(username));
    try {
      await removeProfile(username);
      showSuccess(`Perfil @${username} removido com sucesso!`);
    } catch (error) {
      // Erro já é mostrado via notificação no context
      console.error("Erro ao remover perfil:", error);
    } finally {
      setDeletingUsernames((prev) => {
        const newSet = new Set(prev);
        newSet.delete(username);
        return newSet;
      });
    }
  };

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Perfis do TikTok
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerencie seus perfis do TikTok conectados. Seu plano permite até{" "}
            {profileLimit} perfil(is).
          </Typography>
        </Box>

        {contextError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {contextError}
          </Alert>
        )}

        <Grid container spacing={3}>
          {canAddMore && (
            <Grid item xs={12} md={5}>
              <AddProfileForm />
            </Grid>
          )}
          <Grid item xs={12} md={canAddMore ? 7 : 12}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Perfis Cadastrados ({currentCount}/{profileLimit})
              </Typography>
              {loading ? (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: 200,
                  }}
                >
                  <CircularProgress />
                </Box>
              ) : profiles.length === 0 ? (
                <Alert severity="info">
                  {canAddMore
                    ? "Você ainda não possui perfis cadastrados. Adicione seu primeiro perfil usando o formulário ao lado."
                    : "Você ainda não possui perfis cadastrados."}
                </Alert>
              ) : (
                <Stack spacing={2}>
                  {profiles.map((profile) => (
                    <ProfileCard
                      key={profile.username}
                      profile={profile}
                      onDelete={handleDelete}
                      deleting={deletingUsernames.has(profile.username)}
                    />
                  ))}
                </Stack>
              )}
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Layout>
  );
};

