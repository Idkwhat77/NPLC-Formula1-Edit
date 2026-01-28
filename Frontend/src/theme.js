import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#646cff', // Warna ungu khas dari desain target
      light: '#7c83ff',
      dark: '#4a51cc',
    },
    secondary: {
      main: '#333333',
      contrastText: '#ffffff',
    },
    error: {
      main: '#ff4444',
    },
    background: {
      default: '#1a1a1a', // Latar belakang gelap
      paper: '#2a2a2a',   // Latar belakang kartu/paper
    },
  },
  typography: {
    fontFamily: '"Geist", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          border: '2px solid #646cff',
          boxShadow: '0 0 25px rgba(100, 108, 255, 0.4)', // Efek glow ungu
        },
      },
    },
  },
});

export default theme;