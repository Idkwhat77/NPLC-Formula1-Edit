import { useState, useEffect } from 'react';
import Game from './Game';
import Leaderboard from './Leaderboard';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';

// --- 1. Komponen Wrapper Khusus Kiosk ---
const KioskWrapper = ({ children }) => {
  useEffect(() => {
    // Fungsi matikan klik kanan
    const handleContextMenu = (e) => e.preventDefault();

    // Fungsi matikan shortcut developer (F12, dll) - Opsional
    const handleKeyDown = (e) => {
       if (e.key === 'F12') e.preventDefault();
    };

    // Pasang event listener
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    // Bersihkan event listener saat pindah halaman (Cleanup)
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      // Opsional: Keluar fullscreen saat pindah halaman
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
    };
  }, []);

  // Browser memblokir auto-fullscreen. Harus dipicu tombol.
  const enterKioskMode = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch((err) => {
        console.log("Error attempting to enable full-screen mode:", err.message);
      });
    }
  };

  return (
    <div className="kiosk-area" style={{ width: '100%', height: '100%' }}>
      {/* Tombol kecil/transparan untuk masuk mode Kiosk */}
      <button 
        onClick={enterKioskMode} 
        style={{
          position: 'fixed', 
          top: '10px', 
          left: '10px', 
          zIndex: 9999, 
          padding: '5px 10px',
          opacity: 0.7,
          fontSize: '12px'
        }}
      >
        ⛶ Fullscreen
      </button>
      
      {/* Render halaman Game di sini */}
      {children}
    </div>
  );
};

// --- 2. App Utama ---
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* URL "/" akan membuka Game DENGAN fitur Kiosk */}
        <Route 
          path="/" 
          element={
            <KioskWrapper>
              <Game />
            </KioskWrapper>
          } 
        />
        
        {/* URL "/leaderboard" akan membuka Leaderboard TANPA fitur Kiosk */}
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;