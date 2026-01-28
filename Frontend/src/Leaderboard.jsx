import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';

export default function Leaderboard() {
  const [scores, setScores] = useState([]);

  // --- LOGIKA DATA (Sama seperti sebelumnya) ---
  const fetchScores = () => {
    fetch('http://127.0.0.1:8000/api/game/leaderboard/')
      .then(res => res.json())
      .then(data => setScores(data))
      .catch(err => console.error("Gagal ambil leaderboard:", err));
  };

  useEffect(() => {
    fetchScores();
    const interval = setInterval(fetchScores, 2000); // Auto refresh
    return () => clearInterval(interval);
  }, []);

  const handleReset = async () => {
    if (!confirm("Yakin ingin MENGHAPUS SEMUA data leaderboard?")) return;

    try {
      const res = await fetch('http://127.0.0.1:8000/api/game/reset/', {
        method: 'POST'
      });

      if (res.ok) {
        alert("Leaderboard berhasil di-reset!");
        fetchScores();
      } else {
        alert("Gagal reset database.");
      }
    } catch (err) {
      console.error(err);
      alert("Error koneksi ke server.");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  // --- RENDER TAMPILAN (Material UI) ---
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography 
        variant="h3" 
        component="h1" 
        textAlign="center" 
        fontWeight="bold" 
        color="primary"
        sx={{ mb: 4 }}
      >
        Leaderboard
      </Typography>

      <TableContainer component={Paper} elevation={3} sx={{ mb: 4, borderRadius: 2, overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.main' }}>
              <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold', width: '10%' }}>Rank</TableCell>
              <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold', width: '40%' }}>Tim</TableCell>
              <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold', width: '20%' }}>Skor</TableCell>
              <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold', width: '30%' }}>Waktu Submit</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {scores.length > 0 ? (
              scores.map((s, index) => (
                <TableRow
                  key={index}
                  sx={{
                    '&:nth-of-type(odd)': { bgcolor: 'action.hover' }, // Efek zebra striping
                    '&:hover': { bgcolor: 'action.selected' },
                    transition: 'background-color 0.2s'
                  }}
                >
                  <TableCell>
                    <Typography
                      fontWeight="bold"
                      sx={index < 3 ? { fontSize: '1.2rem' } : {}}
                    >
                      {index + 1}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight="bold" sx={{ textTransform: 'capitalize' }}>
                      {s.team_name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography color="primary" fontWeight="bold" fontSize="1.2rem">
                      {s.score}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" fontFamily="monospace">
                      {formatDate(s.created_at)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography color="text.secondary" sx={{ py: 4, fontStyle: 'italic' }}>
                    Belum ada data permainan.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
        {/* Tombol Kembali Main */}
        <Button
          component={Link}
          to="/"
          variant="contained"
          size="large"
          sx={{ px: 4, fontWeight: 'bold' }}
        >
          Kembali Main
        </Button>

        {/* Tombol Reset */}
        <Button
          variant="outlined"
          color="error"
          size="large"
          onClick={handleReset}
          sx={{ px: 4, fontWeight: 'bold' }}
        >
          Reset Data
        </Button>
      </Box>
    </Container>
  );
}