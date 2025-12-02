import { AppBar, Toolbar, Typography, Box, IconButton } from "@mui/material";
import { Brightness4, Brightness7, Menu as MenuIcon } from "@mui/icons-material";
import { useTheme } from "../../../context/ThemeContext";

interface HeaderProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export const Header = ({ onMenuClick, showMenuButton = false }: HeaderProps) => {
  const { mode, toggleTheme } = useTheme();

  return (
    <AppBar position="static" sx={{ bgcolor: "black" }}>
      <Toolbar>
        {showMenuButton && (
          <IconButton
            color="inherit"
            aria-label="abrir menu"
            edge="start"
            onClick={onMenuClick}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-end",
            flexGrow: 1,
          }}
        >
          <Box
            component="img"
            src="/icons/icon-192x192.png"
            alt="Notikfy Logo"
            sx={{
              height: 32,
              width: 32,
              objectFit: "contain",
            }}
          />
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontFamily:
                '"TikTok Sans", "Roboto", "Helvetica", "Arial", sans-serif',
              fontWeight: 700,
              letterSpacing: "0.02em",
              fontSize: 28,
              lineHeight: 1,
            }}
          >
            NoTikFy
          </Typography>
        </Box>
        <Box>
          <IconButton
            onClick={toggleTheme}
            color="inherit"
            aria-label="alternar tema"
            sx={{ ml: 1 }}
          >
            {mode === "dark" ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
