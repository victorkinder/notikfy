import { createTheme, Theme } from "@mui/material/styles";

const getTheme = (mode: "light" | "dark"): Theme => {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: "#fe2c55",
        dark: "#d91e45",
        light: "#ff5c7a",
        contrastText: "#ffffff",
      },
      secondary: {
        main: "#dc004e",
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    },
  });
};

export default getTheme;
