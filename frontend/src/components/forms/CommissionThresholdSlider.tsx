import {
  Slider,
  Typography,
  Box,
  useMediaQuery,
  useTheme,
} from "@mui/material";

interface CommissionThresholdSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const COMMISSION_VALUES = [50, 100, 250, 500, 1000] as const;

/**
 * Mapeia um valor de comissão para um índice (0-4) para espaçamento uniforme
 */
const valueToIndex = (val: number): number => {
  const index = COMMISSION_VALUES.indexOf(val as typeof COMMISSION_VALUES[number]);
  return index >= 0 ? index : 0;
};

/**
 * Mapeia um índice (0-4) para um valor de comissão
 */
const indexToValue = (index: number): number => {
  const clampedIndex = Math.max(0, Math.min(index, COMMISSION_VALUES.length - 1));
  return COMMISSION_VALUES[Math.round(clampedIndex)];
};

/**
 * Componente reutilizável para selecionar o valor de comissão acumulada
 * Permite selecionar entre valores pré-definidos: 50, 100, 250, 500, 1000
 * Em mobile, o slider é exibido na vertical
 * Os valores são espaçados uniformemente visualmente
 */
export const CommissionThresholdSlider = ({
  value,
  onChange,
  disabled = false,
}: CommissionThresholdSliderProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Converte o valor atual para índice para espaçamento uniforme
  const currentIndex = valueToIndex(value);

  const handleChange = (_event: Event, newValue: number | number[]) => {
    if (typeof newValue === "number") {
      // Converte o índice de volta para o valor de comissão
      const commissionValue = indexToValue(newValue);
      onChange(commissionValue);
    }
  };

  const formatValue = (val: number): string => {
    return `R$ ${val.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <Box
      sx={{
        width: "100%",
        px: 2,
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "center" : "flex-start",
        gap: 2,
      }}
    >
      <Typography
        variant="body2"
        color="text.secondary"
        gutterBottom
        sx={{
          width: isMobile ? "100%" : "auto",
          textAlign: isMobile ? "center" : "left",
        }}
      >
        Valor mínimo de comissão acumulada para notificação
      </Typography>
      <Box
        sx={{
          width: isMobile ? "auto" : "100%",
          height: isMobile ? "300px" : "auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Slider
          value={currentIndex}
          onChange={handleChange}
          min={0}
          max={COMMISSION_VALUES.length - 1}
          step={1}
          marks={COMMISSION_VALUES.map((val, index) => ({
            value: index,
            label: `R$ ${val}`,
          }))}
          disabled={disabled}
          valueLabelDisplay="auto"
          valueLabelFormat={(index) => formatValue(indexToValue(index))}
          orientation={isMobile ? "vertical" : "horizontal"}
          sx={{
            mt: isMobile ? 0 : 2,
            mb: isMobile ? 0 : 1,
            height: isMobile ? "250px" : "auto",
            width: isMobile ? "auto" : "100%",
            // Estilização customizada da barra do slider - mesma aparência para ambas orientações
            "& .MuiSlider-track": {
              backgroundColor: theme.palette.primary.main,
              height: 6,
              width: 6, // Para orientação vertical
              borderRadius: 2,
              border: "none",
            },
            "& .MuiSlider-rail": {
              backgroundColor: theme.palette.mode === "dark" 
                ? "rgba(255, 255, 255, 0.2)" 
                : "rgba(0, 0, 0, 0.2)",
              height: 6,
              width: 6, // Para orientação vertical
              borderRadius: 2,
              opacity: 0.5,
            },
            "& .MuiSlider-thumb": {
              backgroundColor: theme.palette.primary.main,
              width: 24,
              height: 24,
              border: `3px solid ${theme.palette.background.paper}`,
              boxShadow: `0 2px 8px rgba(0, 0, 0, 0.2)`,
              "&:hover": {
                boxShadow: `0 4px 12px rgba(0, 0, 0, 0.3)`,
                transform: "scale(1.1)",
              },
              "&.Mui-focusVisible": {
                boxShadow: `0 0 0 8px rgba(25, 118, 210, 0.16)`,
              },
            },
            "& .MuiSlider-mark": {
              backgroundColor: theme.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.5)"
                : "rgba(0, 0, 0, 0.5)",
              width: 4,
              height: 12,
              borderRadius: 1,
            },
            "& .MuiSlider-markActive": {
              backgroundColor: theme.palette.primary.main,
            },
            "& .MuiSlider-valueLabel": {
              backgroundColor: theme.palette.primary.main,
              borderRadius: 2,
              padding: "4px 8px",
              fontSize: "0.875rem",
              fontWeight: 600,
            },
          }}
        />
        <Typography
          variant="h6"
          color="primary"
          align="center"
          sx={{ mt: isMobile ? 1 : 1 }}
        >
          {formatValue(value)}
        </Typography>
      </Box>
    </Box>
  );
};

