import { useState } from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import { Header } from "../Header/Header";
import { SideMenu } from "../SideMenu/SideMenu";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDrawerClose = () => {
    setMobileOpen(false);
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <SideMenu
        mobileOpen={mobileOpen}
        onMobileClose={handleDrawerClose}
        isMobile={isMobile}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          width: { md: `calc(100% - 240px)` },
        }}
      >
        <Header onMenuClick={handleDrawerToggle} showMenuButton={isMobile} />
        <Box
          component="div"
          sx={{
            flexGrow: 1,
            p: 3,
            backgroundColor: "background.default",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};
