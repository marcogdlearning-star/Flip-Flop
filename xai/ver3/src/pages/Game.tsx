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
import { useGame } from '../contexts/GameContext';

const Game: React.FC = () => {
  const { user } = useAuth();
  const { currentGame, loading, playGame, revealGame, resetGame } = useGame();
  const [wager, setWager] = useState<number>(10);
  const [selectedMove, setSelectedMove] = useState<string>('');
  const [revealSalt, setRevealSalt] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showResult, setShowResult] = useState(false);

  const moves = [
    { value: 'ROCK', emoji: '🪨', label: 'Rock' },
    { value: 'PAPER', emoji: '📄', label: 'Paper' },
    { value: 'SCISSORS', emoji: '✂️', label: 'Scissors' },
  ];

  const handleStartGame = async () => {
    if (!selectedMove) {
      setError('Please select your move');
      return;
    }

    if (wager < 1 || wager > 1000) {
      setError('Wager must be between 1 and 1000 tokens');
      return;
    }

    setError('');
    try {
      await playGame(selectedMove, wager);
    } catch (err: any) {
      setError(err.message || 'Failed to start game');
    }
  };

  const handleRevealGame = async () => {
    if (!revealSalt) {
      setError('Please enter the reveal salt');
      return;
    }

    if (!currentGame) {
      setError('No active game to reveal');
      return;
    }

    setError('');
    try {
      await revealGame(currentGame.gameId, selectedMove, revealSalt);
      setShowResult(true);
    } catch (err: any) {
      setError(err.message || 'Failed to reveal game');
    }
  };

  const handleNewGame = () => {
    resetGame();
    setSelectedMove('');
    setRevealSalt('');
    setError('');
    setShowResult(false);
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

      {!currentGame && (
        <>
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
                onClick={handleStartGame}
                disabled={loading || !selectedMove}
                sx={{
                  backgroundColor: '#ff6b35',
                  '&:hover': { backgroundColor: '#e55a2b' },
                  '&:disabled': { backgroundColor: '#666' },
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Start Game'}
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
                2. Your move is committed to the blockchain with a cryptographic hash.
              </Typography>
              <Typography variant="body2" paragraph>
                3. The house generates a random move using Chainlink VRF.
              </Typography>
              <Typography variant="body2" paragraph>
                4. Reveal your move to determine the winner and collect your payout.
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#ff6b35' }}>
                All games are gas-free and settle instantly!
              </Typography>
            </CardContent>
          </Card>
        </>
      )}

      {currentGame && currentGame.status === 'COMMITTED' && (
        <>
          {/* Reveal Phase */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Reveal Your Move
              </Typography>
              <Alert severity="info" sx={{ mb: 3 }}>
                Your move has been committed to the blockchain. Now reveal it to complete the game.
              </Alert>

              <Box sx={{ mb: 3 }}>
                <TextField
                  label="Reveal Salt"
                  type="text"
                  value={revealSalt}
                  onChange={(e) => setRevealSalt(e.target.value)}
                  placeholder="Enter the salt you used for commitment"
                  fullWidth
                  sx={{ mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  This is the secret salt you used when committing your move.
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleRevealGame}
                  disabled={loading || !revealSalt}
                  sx={{
                    backgroundColor: '#ff6b35',
                    '&:hover': { backgroundColor: '#e55a2b' },
                    '&:disabled': { backgroundColor: '#666' },
                    flex: 1,
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Reveal & Complete Game'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleNewGame}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Game Info */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Game Information
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Chip label={`Game ID: ${currentGame.gameId.slice(0, 12)}...`} />
                <Chip label={`Wager: ${currentGame.wager} tokens`} />
                <Chip label={`Status: ${currentGame.status}`} />
              </Box>
            </CardContent>
          </Card>
        </>
      )}

      {/* Result Dialog */}
      <Dialog open={showResult} onClose={() => setShowResult(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: 'center' }}>
          <Typography variant="h4" sx={{ color: currentGame?.playerWon ? '#4caf50' : '#f44336' }}>
            {currentGame?.playerWon ? '🎉 You Won!' : '😞 You Lost'}
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
                  {moves.find(m => m.value === currentGame?.playerMove)?.emoji}
                </Typography>
                <Typography variant="body1">
                  {moves.find(m => m.value === currentGame?.playerMove)?.label}
                </Typography>
              </Box>
              <Typography variant="h3">VS</Typography>
              <Box>
                <Typography variant="body2" color="text.secondary">House Move</Typography>
                <Typography variant="h4">
                  {moves.find(m => m.value === currentGame?.houseMove)?.emoji}
                </Typography>
                <Typography variant="body1">
                  {moves.find(m => m.value === currentGame?.houseMove)?.label}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body1">
                Wager: <strong>{currentGame?.wager} tokens</strong>
              </Typography>
              {currentGame?.playerWon && (
                <Typography variant="body1" sx={{ color: '#4caf50' }}>
                  Payout: <strong>+{currentGame?.payout} tokens</strong>
                </Typography>
              )}
            </Box>

            <Alert severity={currentGame?.verified ? 'success' : 'warning'}>
              {currentGame?.verified
                ? '✅ Game outcome verified on blockchain'
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
