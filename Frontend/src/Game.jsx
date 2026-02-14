import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Snackbar,
  Alert,
} from '@mui/material';

// Konfigurasi Game
const TIME_PER_QUESTION = 120; // 2 minutes per question
const MAX_QUESTIONS = 30; // Maximum 30 questions (2 rounds of 15)

const PRESETS = [
  { id: 'p1', ops: ['*', '*', '+'], label: '× × +' },
  { id: 'p2', ops: ['+', '*', '+'], label: '+ × +' },
  { id: 'p3', ops: ['+', '+', '*'], label: '+ + ×' },
  { id: 'p4', ops: ['*', '+', '-'], label: '× + -' },
  { id: 'p5', ops: ['*', '-', '*'], label: '× - ×' },
  { id: 'p6', ops: ['*', '+', '*'], label: '× + ×' },
  { id: 'p7', ops: ['*', '-', '-'], label: '× - -' },
  { id: 'p8', ops: ['-', '+', '*'], label: '- + ×' },
  { id: 'p9', ops: ['+', '-', '+'], label: '+ - +' },
  { id: 'p10', ops: ['-', '*', '-'], label: '- × -' },
];

export default function Game() {
  const navigate = useNavigate();
  
  // === 1. STATE MANAGEMENT ===
  const [gameState, setGameState] = useState("MENU"); // MENU | PLAYING | TRANSITION | FINISHED | FINAL_SCORE | FINAL_SCORE
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [teamName, setTeamName] = useState("");
  const [roundScore, setRoundScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [globalQuestion, setGlobalQuestion] = useState(1); // ADD THIS LINE!

  // State Gameplay
  const [score, setScore] = useState(0);
  const [target, setTarget] = useState(0);
  const [poolNumbers, setPoolNumbers] = useState([]);
  const [slots, setSlots] = useState([null, null, null, null]);
  const [selectedPoolIndex, setSelectedPoolIndex] = useState(null);
  const [selectedOps, setSelectedOps] = useState(['?', '?', '?']);
  const [selectedPresetId, setSelectedPresetId] = useState("");

  // State Notification (Toast)
  const [toast, setToast] = useState({ 
    open: false, 
    message: '', 
    severity: 'info' 
  });

  // === 2. HELPER FUNCTIONS ===
  
  // Fungsi untuk memunculkan notifikasi
  const showToast = (message, severity = 'error') => {
    setToast({ open: true, message, severity });
  };

  const handleCloseToast = (event, reason) => {
    if (reason === 'clickaway') return;
    setToast((prev) => ({ ...prev, open: false }));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // === 3. LOGIKA TIMER ===
  useEffect(() => {
    let timerId;
    if (gameState === "PLAYING" && timeLeft > 0) {
      timerId = setInterval(() => {
        setTimeLeft((t) => t - 1);
      }, 1000);
    } else if (gameState === "PLAYING" && timeLeft === 0) {
      // Waktu habis untuk soal ini
      handleTimeUp();
    }
    return () => clearInterval(timerId);
  }, [gameState, timeLeft]);

  // === 4. GAME FLOW FUNCTIONS ===

  const startGame = () => {
    if (!teamName) {
      showToast("Masukkan nama tim dulu!", "warning");
      return;
    }
    setScore(0);
    startFirstRound(1); // Start at question 1
  };

  const startFirstRound = async (questionNum) => {
    setGameState("PLAYING");
    setTimeLeft(TIME_PER_QUESTION);
    setCurrentQuestion(questionNum);
    setSlots([null, null, null, null]);
    setSelectedOps(['?', '?', '?']);
    setSelectedPresetId("");
    setFeedback("");

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/game/start/?q=${questionNum}`);
      const data = await res.json();
      setTarget(data.target);
      setPoolNumbers(data.numbers.map((num, i) => ({ id: i, value: num, used: false })));
    } catch (error) {
      console.error('Error fetching:', error);
      showToast("Gagal mengambil data soal!", "error");
    }
  };

  const startNewRound = async () => {
    if (currentQuestion === 15) {
      // Show round break modal after question 15
      setGameState("FINISHED");
      return;
    }
    if (currentQuestion >= MAX_QUESTIONS) {
      // Game truly finished after question 30 - show final score
      setGameState("FINAL_SCORE");
      return;
    }

    const nextQuestion = currentQuestion + 1;
    const nextGlobalQuestion = globalQuestion + 1;
  
    setCurrentQuestion(nextQuestion);
    setGlobalQuestion(nextGlobalQuestion); // Increment global counter
    setGameState("PLAYING");
    setTimeLeft(TIME_PER_QUESTION);
    setSlots([null, null, null, null]);
    setSelectedOps(['?', '?', '?']);
    setSelectedPresetId("");
    setFeedback("");

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/game/start/?q=${nextGlobalQuestion}`);
      const data = await res.json();
      setTarget(data.target);
      setPoolNumbers(data.numbers.map((num, i) => ({ id: i, value: num, used: false })));
    } catch (error) {
      console.error('Error fetching:', error);
      showToast("Gagal mengambil data soal!", "error");
    }
  };

  const handleTimeUp = () => {
    // Auto-submit if slots are filled, otherwise just end with 0 points
    if (slots.every(s => s !== null) && selectedOps[0] !== '?') {
      handleSubmit(true); // Pass true to indicate auto-submit
    } else {
      const msg = "WAKTU HABIS! Tidak ada poin untuk soal ini.";
      handleRoundEnd(0, msg);
    }
  };

  const finishGame = async () => {
    // This is just a round break - continue to next question
    // Don't reset anything, just continue the game
    
    const nextQuestion = currentQuestion + 1;
    const nextGlobalQuestion = globalQuestion + 1;
  
    setCurrentQuestion(nextQuestion);
    setGlobalQuestion(nextGlobalQuestion);
    setGameState("PLAYING");
    setTimeLeft(TIME_PER_QUESTION);
    setSlots([null, null, null, null]);
    setSelectedOps(['?', '?', '?']);
    setSelectedPresetId("");
    setFeedback("");
    setRoundScore(0);

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/game/start/?q=${nextGlobalQuestion}`);
      const data = await res.json();
      setTarget(data.target);
      setPoolNumbers(data.numbers.map((num, i) => ({ id: i, value: num, used: false })));
      showToast(`Ronde 2 dimulai! Soal ${nextQuestion}`, "success");
    } catch (error) {
      console.error('Error fetching:', error);
      showToast("Gagal mengambil data soal!", "error");
    }
  };

  const submitFinalScore = async () => {
    // Submit final score to database
    try {
      await fetch('http://127.0.0.1:8000/api/game/submit/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_name: teamName,
          score: score
        })
      });
      showToast(`Skor final tersimpan! Total: ${score} poin`, "success");
    } catch (error) {
      console.error("Gagal save skor:", error);
      showToast("Gagal menyimpan skor ke server. Panggil panitia!", "error");
    }

    // Reset everything for next team
    setGameState("MENU");
    setTeamName("");
    setScore(0);
    setCurrentQuestion(1);
    setGlobalQuestion(1);
    setFeedback("");
    setRoundScore(0);
  };

  const handleRoundEnd = (points, msg) => {
    setRoundScore(points);
    setScore(prev => prev + points);
    setFeedback(msg);
    setGameState("TRANSITION");
  };

  const handleStop = () => {
    if (currentQuestion <= 15) {
      // Round 1: Skip to question 16 (round 2 start)
      setCurrentQuestion(15);
      setGlobalQuestion(15);
      setRoundScore(0);
      setFeedback("Ronde 1 dihentikan secara manual. Lanjut ke Ronde 2!");
      setGameState("FINISHED");
    } else {
      // Round 2: Go directly to final score
      setGameState("FINAL_SCORE");
    }
  };

  // === 5. LOGIKA SUBMIT JAWABAN ===
  const handleSubmit = (isAutoSubmit = false) => {
    // Validasi Slot Kosong
    if (slots.some(s => s === null)) {
      if (!isAutoSubmit) {
        showToast("Isi semua slot angka!", "warning");
      }
      return;
    }
    // Validasi Operator Kosong
    if (selectedOps[0] === '?') {
      if (!isAutoSubmit) {
        showToast("Pilih operator dulu!", "warning");
      }
      return;
    }

    const v = slots.map(s => s.value);
    const o = selectedOps;
    const formula = `${v[0]} ${o[0]} ${v[1]} ${o[1]} ${v[2]} ${o[2]} ${v[3]}`;

    let result = 0;
    try {
      result = new Function('return ' + formula)();
    } catch {
      if (!isAutoSubmit) {
        showToast("Error dalam perhitungan rumus", "error");
      }
      return;
    }

    const distance = Math.abs(target - result);
    let pts = 0;
    let msg = "";

    if (distance === 0) {
      pts = 100;
      msg = `SEMPURNA! Hasil: ${result} (+${pts} Poin)`;
    } else {
      pts = Math.max(0, 100 - (distance * 10)); 
      if (pts > 0) {
        msg = `BENAR! Hasil: ${result}, Selisih: ${distance} (+${pts} Poin)`;
      } else {
        msg = `SALAH! Hasil: ${result}, Selisih terlalu besar dari target ${target}`;
      }
    }

    // Add auto-submit indicator to message
    if (isAutoSubmit) {
      msg = `WAKTU HABIS! ${msg}`;
    }

    handleRoundEnd(pts, msg);
  };

  // === 6. INTERACTION HANDLERS ===

  const handleSlotsClick = (slotIndex) => {
    if (slots[slotIndex] !== null) {
      const item = slots[slotIndex];
      const newSlots = [...slots];
      newSlots[slotIndex] = null;
      setSlots(newSlots);
      setPoolNumbers(poolNumbers.map(n => n.id === item.id ? { ...n, used: false } : n));
      return;
    }
    if (selectedPoolIndex !== null) {
      const item = poolNumbers[selectedPoolIndex];
      const newSlots = [...slots];
      newSlots[slotIndex] = item;
      setSlots(newSlots);
      const newPool = [...poolNumbers];
      newPool[selectedPoolIndex].used = true;
      setPoolNumbers(newPool);
      setSelectedPoolIndex(null);
    }
  };

  const handlePoolClick = (index) => {
    if (!poolNumbers[index].used) setSelectedPoolIndex(index);
  };

  const handlePresetChange = (presetId) => {
    const preset = PRESETS.find(p => p.id === presetId);
    if (preset) {
      setSelectedPresetId(presetId);
      setSelectedOps(preset.ops);
    }
  };

  // === 7. RENDER UI ===
  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" color="primary">
            NPLC F1
          </Typography>
          {teamName && (
            <>
              <Typography variant="body2" color="text.secondary">
                Tim: {teamName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Soal: {currentQuestion} / {MAX_QUESTIONS}
              </Typography>
            </>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Chip
            label={`Total Skor: ${score}`}
            color="primary"
            sx={{ fontWeight: 'bold', mb: 1 }}
          />
          <Typography
            variant="body1"
            fontWeight="bold"
            color={timeLeft <= 10 ? 'error' : 'text.primary'}
            sx={{ mb: 1 }}
          >
            Sisa Waktu: {formatTime(timeLeft)}
          </Typography>
          {gameState === "PLAYING" && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={handleStop}
              sx={{ fontWeight: 'bold' }}
            >
              {currentQuestion <= 15 ? "STOP - RONDE 2" : "STOP - SELESAI"}
            </Button>
          )}
        </Box>
      </Box>

      {/* Modal 1: Menu */}
      <Dialog open={gameState === "MENU"} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>
          Selamat Datang
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
            Game terdiri dari 2 ronde, dimana tiap ronde 15 soal.<br />
            Setiap soal memiliki waktu 2 menit.
          </Typography>
          <TextField
            fullWidth
            placeholder="Nama Tim..."
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            variant="outlined"
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={startGame}
          >
            MULAI GAME
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal 2: Transition */}
      <Dialog open={gameState === "TRANSITION"} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>
          Soal {currentQuestion} Selesai
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {feedback}
          </Typography>
          <Typography variant="h2" color="primary" fontWeight="bold" sx={{ my: 3 }}>
            +{roundScore}
          </Typography>
          {currentQuestion < MAX_QUESTIONS && (
            <Typography variant="body2" color="text.secondary">
              Soal berikutnya: {currentQuestion + 1} / {MAX_QUESTIONS}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={startNewRound}
          >
            {currentQuestion < MAX_QUESTIONS ? "SOAL BERIKUTNYA" : "LIHAT HASIL AKHIR"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal 3: Round Break */}
      <Dialog open={gameState === "FINISHED"} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', color: 'primary.main' }}>
          RONDE SELESAI!
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Tim {teamName} telah menyelesaikan {currentQuestion} soal.
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Skor Ronde Ini:
          </Typography>
          <Typography variant="h1" color="primary" fontWeight="bold" sx={{ my: 3 }}>
            {score}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Siap untuk ronde berikutnya?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, flexDirection: 'column', gap: 1 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={finishGame}
          >
            Selesai & Ronde Berikutnya
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal 4: Final Score */}
      <Dialog open={gameState === "FINAL_SCORE"} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', color: 'success.main' }}>
          🎉 GAME SELESAI! 🎉
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Tim {teamName} telah menyelesaikan semua 30 soal!
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Skor Final:
          </Typography>
          <Typography variant="h1" color="success.main" fontWeight="bold" sx={{ my: 3 }}>
            {score}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Selamat! Skor akan disimpan ke leaderboard.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, flexDirection: 'column', gap: 1 }}>
          <Button
            fullWidth
            variant="contained"
            color="success"
            onClick={submitFinalScore}
          >
            Simpan Skor & Selesai
          </Button>
        </DialogActions>
      </Dialog>

      {/* Gameplay Area */}
      <Box
        sx={{
          filter: gameState !== "PLAYING" ? 'blur(4px)' : 'none',
          pointerEvents: gameState !== "PLAYING" ? 'none' : 'auto',
          transition: 'filter 0.3s',
        }}
      >
        {/* Number Pool - Small boxes at top */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
          {poolNumbers.map((num, i) => (
            <Paper
              key={num.id}
              elevation={selectedPoolIndex === i ? 4 : 1}
              onClick={() => handlePoolClick(i)}
              sx={{
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: num.used ? 'default' : 'pointer',
                opacity: num.used ? 0.3 : 1,
                bgcolor: selectedPoolIndex === i ? 'success.light' : 'background.paper',
                border: 2,
                borderColor: selectedPoolIndex === i ? 'success.main' : 'grey.400',
                fontWeight: 'bold',
                fontSize: '1rem',
                transition: 'all 0.15s',
                '&:hover': {
                  bgcolor: !num.used ? 'action.hover' : undefined,
                  transform: !num.used ? 'scale(1.05)' : undefined,
                },
              }}
            >
              {num.value}
            </Paper>
          ))}
        </Box>

        {/* Expression Area - Large slots with operators */}
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 3, 
            mb: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Slots Row */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            {[0, 1, 2, 3].map((slotIndex) => (
              <Box key={slotIndex} sx={{ display: 'flex', alignItems: 'center' }}>
                <Paper
                  variant="outlined"
                  onClick={() => handleSlotsClick(slotIndex)}
                  sx={{
                    width: 64,
                    height: 64,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    borderWidth: 3,
                    borderColor: slots[slotIndex] ? 'primary.main' : 'grey.600',
                    fontWeight: 'bold',
                    fontSize: '1.5rem',
                    bgcolor: slots[slotIndex] ? 'primary.dark' : 'background.paper',
                    color: slots[slotIndex] ? 'primary.contrastText' : 'text.primary',
                    transition: 'all 0.15s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: slots[slotIndex] ? 'primary.main' : 'action.hover',
                    },
                  }}
                >
                  {slots[slotIndex]?.value ?? ''}
                </Paper>
                {slotIndex < 3 && (
                  <Typography 
                    variant="h4" 
                    fontWeight="bold" 
                    sx={{ 
                      mx: 1, 
                      minWidth: 24, 
                      textAlign: 'center',
                      color: selectedOps[slotIndex] === '?' ? 'text.disabled' : 'text.primary',
                      opacity: selectedOps[slotIndex] === '?' ? 0.5 : 1,
                    }}
                  >
                    {selectedOps[slotIndex] === '?' ? '?' : selectedOps[slotIndex].replace('*', '×')}
                  </Typography>
                )}
              </Box>
            ))}
            
            {/* Equals and Target */}
            <Typography variant="h4" fontWeight="bold" sx={{ mx: 1 }}>
              =
            </Typography>
            <Paper
              elevation={4}
              sx={{
                width: 72,
                height: 64,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'secondary.main',
                color: 'secondary.contrastText',
                fontWeight: 'bold',
                fontSize: '1.75rem',
              }}
            >
              {target}
            </Paper>
          </Box>

          {/* Submit Button */}
          <Button
            variant="contained"
            size="large"
            onClick={handleSubmit}
            sx={{ 
              px: 6, 
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 'bold',
            }}
          >
            SUBMIT
          </Button>

        </Paper>

        {/* Operator Presets - 2x5 Table Grid */}
        <Paper 
          variant="outlined" 
          sx={{ 
            overflow: 'hidden',
            '& .MuiBox-root': {
              borderColor: 'divider',
            }
          }}
        >
          {/* Row 1 */}
          <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
            {PRESETS.slice(0, 5).map((preset, index) => (
              <Box
                key={preset.id}
                onClick={() => handlePresetChange(preset.id)}
                sx={{
                  flex: 1,
                  py: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  bgcolor: selectedPresetId === preset.id ? 'primary.dark' : 'background.paper',
                  borderRight: index < 4 ? 1 : 0,
                  borderColor: 'divider',
                  transition: 'all 0.15s',
                  '&:hover': {
                    bgcolor: selectedPresetId === preset.id ? 'primary.main' : 'action.hover',
                  },
                }}
              >
                <Typography 
                  variant="body1" 
                  fontFamily="monospace" 
                  fontWeight="bold"
                  color={selectedPresetId === preset.id ? 'primary.contrastText' : 'text.primary'}
                >
                  {preset.label}
                </Typography>
              </Box>
            ))}
          </Box>
          {/* Row 2 */}
          <Box sx={{ display: 'flex' }}>
            {PRESETS.slice(5, 10).map((preset, index) => (
              <Box
                key={preset.id}
                onClick={() => handlePresetChange(preset.id)}
                sx={{
                  flex: 1,
                  py: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  bgcolor: selectedPresetId === preset.id ? 'primary.dark' : 'background.paper',
                  borderRight: index < 4 ? 1 : 0,
                  borderColor: 'divider',
                  transition: 'all 0.15s',
                  '&:hover': {
                    bgcolor: selectedPresetId === preset.id ? 'primary.main' : 'action.hover',
                  },
                }}
              >
                <Typography 
                  variant="body1" 
                  fontFamily="monospace" 
                  fontWeight="bold"
                  color={selectedPresetId === preset.id ? 'primary.contrastText' : 'text.primary'}
                >
                  {preset.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>

      {/* NOTIFICATION SNACKBAR (TOAST) */}
      <Snackbar 
        open={toast.open} 
        autoHideDuration={3000} 
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseToast} 
          severity={toast.severity} 
          variant="filled" 
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>

    </Container>
  );
}