import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Box,
  TextField,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Avatar,
  Fab,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';

const Game: React.FC = () => {
  const { user, updateTokens } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [wager, setWager] = useState<number>(10);
  const [selectedMove, setSelectedMove] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [gameResult, setGameResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Sound effects using Web Audio API
  const playSound = (frequency: number, duration: number = 200) => {
    if (!soundEnabled) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.log('Sound not supported');
    }
  };

  const moves = [
    {
      value: 'ROCK',
      emoji: '🪨',
      label: 'Rock',
      color: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
      shadowColor: '#654321'
    },
    {
      value: 'PAPER',
      emoji: '📄',
      label: 'Paper',
      color: 'linear-gradient(135deg, #FFFFFF 0%, #F5F5F5 100%)',
      shadowColor: '#CCCCCC'
    },
    {
      value: 'SCISSORS',
      emoji: '✂️',
      label: 'Scissors',
      color: 'linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)',
      shadowColor: '#888888'
    },
  ];

  const handlePlayGame = async () => {
    if (!selectedMove) {
      setError('Please select your move');
      return;
    }

    if (wager < 1 || wager > 1000) {
      setError('Wager must be between 1 and 1000 tokens');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/games/play-house', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ move: selectedMove, wager }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to play game');
      }

      const data = await response.json();

      // Update user balance
      updateTokens(data.settlement.newBalance);

      // Show results
      setGameResult(data);
      setShowResult(true);

    } catch (err: any) {
      setError(err.message || 'Failed to play game');
    } finally {
      setLoading(false);
    }
  };

  const handleNewGame = () => {
    setSelectedMove('');
    setError('');
    setShowResult(false);
    setGameResult(null);
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Please login to play
        </Typography>
      </Container>
    );
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      py: isMobile ? 2 : 4,
      position: 'relative'
    }}>
      {/* Sound Toggle */}
      <Fab
        size="small"
        onClick={() => setSoundEnabled(!soundEnabled)}
        sx={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 1000,
          backgroundColor: soundEnabled ? '#4caf50' : '#666',
          '&:hover': {
            backgroundColor: soundEnabled ? '#45a049' : '#555'
          }
        }}
      >
        {soundEnabled ? <VolumeUpIcon /> : <VolumeOffIcon />}
      </Fab>

      <Container maxWidth="sm" sx={{ px: isMobile ? 2 : 3 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: isMobile ? 3 : 4 }}>
          <Typography
            variant={isMobile ? "h4" : "h3"}
            component="h1"
            sx={{
              color: 'white',
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
              mb: 1
            }}
          >
            🪨📄✂️ Rock-Paper-Scissors
          </Typography>
          <Typography
            variant={isMobile ? "body1" : "h6"}
            sx={{
              color: 'rgba(255,255,255,0.8)',
              fontWeight: 300
            }}
          >
            Gas-free gaming with blockchain fairness
          </Typography>
        </Box>

        {/* Balance Display */}
        <Paper
          elevation={3}
          sx={{
            p: 2,
            mb: 3,
            background: 'rgba(255,255,255,0.95)',
            borderRadius: 3,
            textAlign: 'center'
          }}
        >
          <Typography variant="h6" sx={{ color: '#333', fontWeight: 'bold' }}>
            💰 Balance: {user.tokens} tokens
          </Typography>
        </Paper>

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
          >
            {error}
          </Alert>
        )}

        {/* Move Selection */}
        <Paper
          elevation={3}
          sx={{
            p: isMobile ? 2 : 3,
            mb: 3,
            background: 'rgba(255,255,255,0.95)',
            borderRadius: 3
          }}
        >
          <Typography
            variant="h6"
            sx={{
              mb: 3,
              textAlign: 'center',
              color: '#333',
              fontWeight: 'bold'
            }}
          >
            Choose Your Move
          </Typography>

          <Grid container spacing={isMobile ? 1 : 2}>
            {moves.map((move) => (
              <Grid item xs={4} key={move.value}>
                <Button
                  fullWidth
                  onClick={() => {
                    setSelectedMove(move.value);
                    playSound(440, 150); // A note
                  }}
                  sx={{
                    height: isMobile ? 80 : 100,
                    flexDirection: 'column',
                    borderRadius: 3,
                    background: selectedMove === move.value
                      ? 'linear-gradient(135deg, #ff6b35 0%, #ff4757 100%)'
                      : move.color,
                    border: selectedMove === move.value ? '3px solid #fff' : '2px solid rgba(0,0,0,0.1)',
                    boxShadow: selectedMove === move.value
                      ? '0 8px 25px rgba(255,107,53,0.4)'
                      : `0 4px 15px ${move.shadowColor}40`,
                    transform: selectedMove === move.value ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.02)',
                      boxShadow: `0 6px 20px ${move.shadowColor}60`,
                    },
                    '&:active': {
                      transform: 'scale(0.98)',
                    }
                  }}
                >
                  <Typography variant={isMobile ? "h4" : "h3"} sx={{ mb: 0.5, filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.3))' }}>
                    {move.emoji}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: selectedMove === move.value ? 'white' : '#333',
                      fontWeight: 'bold',
                      textShadow: selectedMove === move.value ? '1px 1px 2px rgba(0,0,0,0.3)' : 'none'
                    }}
                  >
                    {move.label}
                  </Typography>
                </Button>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Wager Input */}
        <Paper
          elevation={3}
          sx={{
            p: isMobile ? 2 : 3,
            mb: 3,
            background: 'rgba(255,255,255,0.95)',
            borderRadius: 3
          }}
        >
          <TextField
            label="Wager Amount"
            type="number"
            value={wager}
            onChange={(e) => setWager(Number(e.target.value))}
            inputProps={{ min: 1, max: 1000 }}
            fullWidth
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: 'rgba(255,255,255,0.8)'
              }
            }}
          />
          <Typography
            variant="body2"
            sx={{
              color: '#666',
              textAlign: 'center',
              fontSize: isMobile ? '0.75rem' : '0.875rem'
            }}
          >
            Min: 1 token | Max: 1000 tokens | House Edge: 2%
          </Typography>
        </Paper>

        {/* Play Button */}
        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={() => {
            handlePlayGame();
            playSound(523, 300); // C note
          }}
          disabled={loading || !selectedMove}
          sx={{
            height: isMobile ? 56 : 64,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontSize: isMobile ? '1.1rem' : '1.25rem',
            fontWeight: 'bold',
            boxShadow: '0 8px 25px rgba(102,126,234,0.4)',
            textTransform: 'none',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
              boxShadow: '0 12px 35px rgba(102,126,234,0.6)',
              transform: 'translateY(-2px)',
            },
            '&:disabled': {
              background: '#ccc',
              boxShadow: 'none',
              transform: 'none',
            },
            transition: 'all 0.3s ease',
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={24} color="inherit" />
              Playing...
            </Box>
          ) : (
            '🎮 Play Game'
          )}
        </Button>

        {/* How It Works */}
        <Paper
          elevation={2}
          sx={{
            mt: 3,
            p: isMobile ? 2 : 3,
            background: 'rgba(255,255,255,0.9)',
            borderRadius: 3
          }}
        >
          <Typography
            variant="h6"
            sx={{
              mb: 2,
              textAlign: 'center',
              color: '#333',
              fontWeight: 'bold'
            }}
          >
            🎯 How It Works
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body2" sx={{ color: '#555', fontSize: isMobile ? '0.8rem' : '0.875rem' }}>
              • Choose Rock, Paper, or Scissors
            </Typography>
            <Typography variant="body2" sx={{ color: '#555', fontSize: isMobile ? '0.8rem' : '0.875rem' }}>
              • Set your wager amount
            </Typography>
            <Typography variant="body2" sx={{ color: '#555', fontSize: isMobile ? '0.8rem' : '0.875rem' }}>
              • House generates fair random move
            </Typography>
            <Typography variant="body2" sx={{ color: '#555', fontSize: isMobile ? '0.8rem' : '0.875rem' }}>
              • Winner takes payout instantly!
            </Typography>
          </Box>
        </Paper>
      </Container>

      {/* Result Dialog */}
      <Dialog
        open={showResult}
        onClose={() => setShowResult(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
          }
        }}
      >
        <DialogTitle sx={{
          textAlign: 'center',
          pb: 1,
          background: gameResult?.result.outcome === 'win'
            ? 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)'
            : gameResult?.result.outcome === 'tie'
            ? 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)'
            : 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
          color: 'white',
          borderRadius: '4px 4px 0 0'
        }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            {gameResult?.result.outcome === 'win' ? '🎉 You Won!' :
             gameResult?.result.outcome === 'tie' ? '🤝 It\'s a Tie!' : '😞 You Lost'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 4,
              mb: 3,
              flexWrap: 'wrap'
            }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Your Move</Typography>
                <Avatar sx={{
                  width: isMobile ? 60 : 80,
                  height: isMobile ? 60 : 80,
                  mx: 'auto',
                  mb: 1,
                  background: moves.find(m => m.value === gameResult?.result.playerMove)?.color,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}>
                  <Typography variant={isMobile ? "h4" : "h3"}>
                    {moves.find(m => m.value === gameResult?.result.playerMove)?.emoji}
                  </Typography>
                </Avatar>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {moves.find(m => m.value === gameResult?.result.playerMove)?.label}
                </Typography>
              </Box>

              <Typography variant="h3" sx={{ color: '#666', mx: 2 }}>VS</Typography>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>House Move</Typography>
                <Avatar sx={{
                  width: isMobile ? 60 : 80,
                  height: isMobile ? 60 : 80,
                  mx: 'auto',
                  mb: 1,
                  background: moves.find(m => m.value === gameResult?.result.houseMove)?.color,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}>
                  <Typography variant={isMobile ? "h4" : "h3"}>
                    {moves.find(m => m.value === gameResult?.result.houseMove)?.emoji}
                  </Typography>
                </Avatar>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {moves.find(m => m.value === gameResult?.result.houseMove)?.label}
                </Typography>
              </Box>
            </Box>

            <Box sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: 'rgba(0,0,0,0.04)',
              mb: 2
            }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                💰 Wager: <strong>{gameResult?.result.wager} tokens</strong>
              </Typography>
              {gameResult?.result.outcome === 'win' && (
                <Typography variant="body1" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                  🏆 Payout: <strong>+{gameResult?.result.payout} tokens</strong>
                </Typography>
              )}
              {gameResult?.result.outcome === 'tie' && (
                <Typography variant="body1" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                  ↩️ Wager Returned: <strong>{gameResult?.result.payout} tokens</strong>
                </Typography>
              )}
              {gameResult?.result.outcome === 'loss' && (
                <Typography variant="body1" sx={{ color: '#f44336', fontWeight: 'bold' }}>
                  💸 Loss: <strong>-{gameResult?.result.wager} tokens</strong>
                </Typography>
              )}
            </Box>

            <Alert
              severity={gameResult?.verified ? 'success' : 'warning'}
              sx={{ borderRadius: 2 }}
            >
              {gameResult?.verified
                ? '✅ Game outcome verified with blockchain randomness'
                : '⏳ Game verification in progress'
              }
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button
            variant="contained"
            onClick={() => {
              setShowResult(false);
              handleNewGame();
              playSound(330, 200); // E note
            }}
            sx={{
              borderRadius: 3,
              px: 4,
              py: 1.5,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              fontWeight: 'bold',
              textTransform: 'none',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
              }
            }}
          >
            🎮 Play Again
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Game;
