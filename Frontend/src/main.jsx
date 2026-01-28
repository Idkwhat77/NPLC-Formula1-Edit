import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Import MUI Theme Provider
import { ThemeProvider, CssBaseline } from '@mui/material'
import theme from './theme' // Import tema yang baru dibuat

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Ini penting untuk mengaktifkan background gelap */}
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)