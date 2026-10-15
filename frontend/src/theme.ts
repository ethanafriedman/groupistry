import { alpha, createTheme } from "@mui/material/styles";

const navy = "#162033";
const indigo = "#5B5BD6";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: navy,
      contrastText: "#ffffff",
    },
    secondary: {
      main: indigo,
      light: "#ECECFF",
      dark: "#4545B8",
    },
    success: {
      main: "#17845B",
    },
    warning: {
      main: "#B87516",
    },
    background: {
      default: "#F5F6F8",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#182230",
      secondary: "#667085",
    },
    divider: "#E6E8EC",
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h3: {
      fontWeight: 760,
      letterSpacing: "-0.035em",
    },
    h4: {
      fontWeight: 740,
      letterSpacing: "-0.025em",
    },
    h5: {
      fontWeight: 720,
      letterSpacing: "-0.02em",
    },
    h6: {
      fontWeight: 700,
      letterSpacing: "-0.01em",
    },
    button: {
      textTransform: "none",
      fontWeight: 650,
      letterSpacing: 0,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage:
            "radial-gradient(circle at 15% 0%, rgba(91,91,214,.06), transparent 28%)",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 10,
          minHeight: 42,
          paddingInline: 18,
        },
        containedSecondary: {
          boxShadow: "0 8px 20px rgba(91,91,214,.16)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid #E6E8EC",
          borderRadius: 14,
          boxShadow: "0 1px 2px rgba(16,24,40,.02)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 16,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: "small",
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: "#FFFFFF",
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#B9BEC8",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderWidth: 1,
            borderColor: indigo,
            boxShadow: `0 0 0 3px ${alpha(indigo, 0.1)}`,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});
