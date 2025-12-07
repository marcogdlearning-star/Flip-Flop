import React from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Box,
  Chip,
  Avatar,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const { stats, gameHistory } = useGame();

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Please login to view your profile
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Player Profile
      </Typography>

      <Grid container spacing={4}>
        {/* Profile Info */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: '#ff6b35',
                  fontSize: '2rem',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                {user.username.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="h5" gutterBottom>
                {user.username}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {user.email}
              </Typography>
              <Chip
                label={`${user.tokens.toFixed(2)} tokens`}
                sx={{
                  backgroundColor: '#ff6b35',
                  color: 'white',
                  fontWeight: 'bold',
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Statistics */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Gaming Statistics
              </Typography>
              {stats ? (
                <Grid container spacing={3}>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" sx={{ color: '#ff6b35' }}>
                        {stats.totalGamesPlayed}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Games
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" sx={{ color: '#4caf50' }}>
                        {stats.gamesWon}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Games Won
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" sx={{ color: '#2196f3' }}>
                        {stats.winRate}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Win Rate
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" sx={{ color: stats.profitLoss >= 0 ? '#4caf50' : '#f44336' }}>
                        {stats.profitLoss >= 0 ? '+' : ''}{stats.profitLoss.toFixed(2)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Profit
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Loading statistics...
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Games */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Recent Games
              </Typography>
              {gameHistory.length > 0 ? (
                <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                  {gameHistory.slice(0, 10).map((game) => (
                    <Box
                      key={game.id}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 1,
                        borderBottom: '1px solid #eee',
                      }}
                    >
                      <Box>
                        <Typography variant="body1">
                          {game.playerMove} vs {game.houseMove}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Wager: {game.wager} tokens • {new Date(game.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Box textAlign="right">
                        <Chip
                          label={game.playerWon ? `+${game.payout}` : `-${game.wager}`}
                          sx={{
                            backgroundColor: game.playerWon ? '#4caf50' : '#f44336',
                            color: 'white',
                          }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No games played yet. Start playing to see your game history!
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile;
