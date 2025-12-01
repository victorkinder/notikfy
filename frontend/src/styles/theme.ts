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
      MuiAlert: {
        styleOverrides: {
          icon: {
            fontSize: "24px",
            width: "24px",
            height: "24px",
            "& > svg": {
              fontSize: "24px",
              width: "24px",
              height: "24px",
            },
          },
        },
      },
    },
  });
};

export default getTheme;
