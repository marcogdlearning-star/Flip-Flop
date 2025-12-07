import React, { useState } from 'react';
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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const Game: React.FC = () => {
  const { user, updateTokens } = useAuth();
  const [wager, setWager] = useState<number>(10);
  const [selectedMove, setSelectedMove] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [gameResult, setGameResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const moves = [
    { value: 'ROCK', emoji: '🪨', label: 'Rock' },
    { value: 'PAPER', emoji: '📄', label: 'Paper' },
    { value: 'SCISSORS', emoji: '✂️', label: 'Scissors' },
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
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" textAlign="center" gutterBottom>
        Rock-Paper-Scissors
      </Typography>
      <Typography variant="h6" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
        Play against the house with gas-free gaming
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Game Setup */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Choose Your Move
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {moves.map((move) => (
              <Grid item xs={4} key={move.value}>
                <Button
                  variant={selectedMove === move.value ? 'contained' : 'outlined'}
                  fullWidth
                  size="large"
                  onClick={() => setSelectedMove(move.value)}
                  sx={{
                    height: 100,
                    flexDirection: 'column',
                    backgroundColor: selectedMove === move.value ? '#ff6b35' : 'transparent',
                    '&:hover': {
                      backgroundColor: selectedMove === move.value ? '#e55a2b' : undefined,
                    },
                  }}
                >
                  <Typography variant="h3" sx={{ mb: 1 }}>
                    {move.emoji}
                  </Typography>
                  <Typography variant="body1">
                    {move.label}
                  </Typography>
                </Button>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mb: 3 }}>
            <TextField
              label="Wager Amount"
              type="number"
              value={wager}
              onChange={(e) => setWager(Number(e.target.value))}
              inputProps={{ min: 1, max: 1000 }}
              fullWidth
              sx={{ mb: 1 }}
            />
            <Typography variant="body2" color="text.secondary">
              Min: 1 token | Max: 1000 tokens | House Edge: 2%
            </Typography>
          </Box>

          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handlePlayGame}
            disabled={loading || !selectedMove}
            sx={{
              backgroundColor: '#ff6b35',
              '&:hover': { backgroundColor: '#e55a2b' },
              '&:disabled': { backgroundColor: '#666' },
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Play Game'}
          </Button>
        </CardContent>
      </Card>

      {/* Game Rules */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            How It Works
          </Typography>
          <Typography variant="body2" paragraph>
            1. Choose your move (Rock, Paper, or Scissors) and set your wager amount.
          </Typography>
          <Typography variant="body2" paragraph>
            2. Click "Play Game" to instantly play against the house.
          </Typography>
          <Typography variant="body2" paragraph>
            3. The house generates a cryptographically fair random move using blockchain randomness.
          </Typography>
          <Typography variant="body2" paragraph>
            4. Results are calculated instantly and your balance is updated immediately.
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#ff6b35' }}>
            All games are gas-free and settle instantly with blockchain-verified fairness!
          </Typography>
        </CardContent>
      </Card>

      {/* Result Dialog */}
      <Dialog open={showResult} onClose={() => setShowResult(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: 'center' }}>
          <Typography variant="h4" sx={{
            color: gameResult?.result.outcome === 'win' ? '#4caf50' :
                   gameResult?.result.outcome === 'tie' ? '#ff9800' : '#f44336'
          }}>
            {gameResult?.result.outcome === 'win' ? '🎉 You Won!' :
             gameResult?.result.outcome === 'tie' ? '🤝 It\'s a Tie!' : '😞 You Lost'}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Game Results
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mb: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Your Move</Typography>
                <Typography variant="h4">
                  {moves.find(m => m.value === gameResult?.result.playerMove)?.emoji}
                </Typography>
                <Typography variant="body1">
                  {moves.find(m => m.value === gameResult?.result.playerMove)?.label}
                </Typography>
              </Box>
              <Typography variant="h3">VS</Typography>
              <Box>
                <Typography variant="body2" color="text.secondary">House Move</Typography>
                <Typography variant="h4">
                  {moves.find(m => m.value === gameResult?.result.houseMove)?.emoji}
                </Typography>
                <Typography variant="body1">
                  {moves.find(m => m.value === gameResult?.result.houseMove)?.label}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body1">
                Wager: <strong>{gameResult?.result.wager} tokens</strong>
              </Typography>
              {gameResult?.result.outcome === 'win' && (
                <Typography variant="body1" sx={{ color: '#4caf50' }}>
                  Payout: <strong>+{gameResult?.result.payout} tokens</strong>
                </Typography>
              )}
              {gameResult?.result.outcome === 'tie' && (
                <Typography variant="body1" sx={{ color: '#ff9800' }}>
                  Wager Returned: <strong>{gameResult?.result.payout} tokens</strong>
                </Typography>
              )}
              {gameResult?.result.outcome === 'loss' && (
                <Typography variant="body1" sx={{ color: '#f44336' }}>
                  Loss: <strong>-{gameResult?.result.wager} tokens</strong>
                </Typography>
              )}
            </Box>

            <Alert severity={gameResult?.verified ? 'success' : 'warning'}>
              {gameResult?.verified
                ? '✅ Game outcome verified with blockchain randomness'
                : '⏳ Game verification in progress'
              }
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center' }}>
          <Button
            variant="contained"
            onClick={() => {
              setShowResult(false);
              handleNewGame();
            }}
            sx={{
              backgroundColor: '#ff6b35',
              '&:hover': { backgroundColor: '#e55a2b' },
            }}
          >
            Play Again
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Game;
