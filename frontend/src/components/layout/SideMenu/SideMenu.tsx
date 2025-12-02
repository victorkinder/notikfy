import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Typography,
  Box,
  Divider,
  IconButton,
  Toolbar,
} from "@mui/material";
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  AttachMoney as SalesIcon,
  Settings as SettingsIcon,
  VpnKey as ActivationIcon,
  MusicNote as TikTokProfileIcon,
} from "@mui/icons-material";
import { useAuth } from "../../../context/AuthContext";

const DRAWER_WIDTH = 240;
const DRAWER_WIDTH_COLLAPSED = 64;

interface MenuItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const menuItems: MenuItem[] = [
  { path: "/sales", label: "Vendas", icon: <SalesIcon /> },
  {
    path: "/tiktok-profiles",
    label: "Perfis TikTok",
    icon: <TikTokProfileIcon />,
  },
  { path: "/settings", label: "Configurações", icon: <SettingsIcon /> },
  { path: "/activation", label: "Ativação", icon: <ActivationIcon /> },
];

interface SideMenuProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  isMobile?: boolean;
}

export const SideMenu = ({
  mobileOpen = false,
  onMobileClose,
  isMobile = false,
}: SideMenuProps) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const handleToggle = () => {
    setOpen(!open);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile && onMobileClose) {
      onMobileClose();
    }
  };

  const getDisplayName = () => {
    if (user?.displayName) {
      return user.displayName;
    }
    if (user?.email) {
      return user.email.split("@")[0];
    }
    return "Usuário";
  };

  const getAvatarUrl = () => {
    return user?.photoURL || undefined;
  };

  // Em mobile, o menu sempre aparece expandido quando aberto
  const isExpanded = isMobile ? true : open;

  const drawerContent = (
    <>
      <Toolbar
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: isExpanded ? "flex-end" : "center",
          px: [1],
        }}
      >
        {!isMobile && (
          <IconButton onClick={handleToggle} aria-label="toggle menu">
            {open ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
        )}
        {isMobile && (
          <IconButton
            onClick={onMobileClose}
            aria-label="close menu"
            sx={{ ml: "auto" }}
          >
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Toolbar>
      <List
        sx={{
          flexGrow: 1,
          py: 1,
        }}
      >
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ display: "block" }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                selected={isActive}
                sx={{
                  minHeight: 48,
                  height: 48,
                  justifyContent: isExpanded ? "initial" : "center",
                  px: isExpanded ? 2.5 : 0,
                  "&.Mui-selected": {
                    backgroundColor: "primary.main",
                    color: "primary.contrastText",
                    "&:hover": {
                      backgroundColor: "primary.dark",
                    },
                    "& .MuiListItemIcon-root": {
                      color: "primary.contrastText",
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: isExpanded ? 3 : 0,
                    justifyContent: "center",
                    display: "flex",
                    alignItems: "center",
                    "& > svg": {
                      fontSize: "24px",
                      width: "24px",
                      height: "24px",
                    },
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  sx={{
                    opacity: isExpanded ? 1 : 0,
                    display: isExpanded ? "block" : "none",
                    transition: "opacity 0.3s ease",
                    margin: 0,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Divider />
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          gap: 2,
          minHeight: 80,
        }}
      >
        <Avatar
          src={getAvatarUrl()}
          alt={getDisplayName()}
          sx={{
            width: isExpanded ? 40 : 32,
            height: isExpanded ? 40 : 32,
            flexShrink: 0,
          }}
        >
          {!getAvatarUrl() && getDisplayName().charAt(0).toUpperCase()}
        </Avatar>
        {isExpanded && (
          <Box
            sx={{
              opacity: isExpanded ? 1 : 0,
              transition: "opacity 0.3s ease",
              overflow: "hidden",
              flex: 1,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {getDisplayName()}
            </Typography>
            {user?.email && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  display: "block",
                }}
              >
                {user.email}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{
          keepMounted: true, // Melhora performance em mobile
        }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: DRAWER_WIDTH,
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        display: { xs: "none", md: "block" },
        width: open ? DRAWER_WIDTH : DRAWER_WIDTH_COLLAPSED,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: open ? DRAWER_WIDTH : DRAWER_WIDTH_COLLAPSED,
          boxSizing: "border-box",
          transition: "width 0.3s ease",
          overflowX: "hidden",
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};
