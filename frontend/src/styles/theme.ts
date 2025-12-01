import { createTheme, Theme } from "@mui/material/styles";

const getTheme = (mode: "light" | "dark"): Theme => {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: "#1976d2",
      },
      secondary: {
        main: "#dc004e",
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    },
    components: {
      // Customizações de componentes podem ser adicionadas aqui
    },
  });
};

export default getTheme;
