import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Chip,
  Box,
  CircularProgress,
} from '@mui/material';
import { EmojiEvents, TrendingUp } from '@mui/icons-material';

interface LeaderboardEntry {
  id: number;
  username: string;
  totalGamesPlayed: number;
  gamesWon: number;
  totalWon: number;
  totalWagered: number;
  winRate: string;
  profitLoss: number;
}

const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const response = await fetch('/api/games/leaderboard/global?limit=50');
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard);
      }
    } catch (error) {
      console.error('Load leaderboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <EmojiEvents sx={{ color: '#ffd700' }} />;
    if (rank === 2) return <EmojiEvents sx={{ color: '#c0c0c0' }} />;
    if (rank === 3) return <EmojiEvents sx={{ color: '#cd7f32' }} />;
    return null;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#ffd700';
    if (rank === 2) return '#c0c0c0';
    if (rank === 3) return '#cd7f32';
    return 'transparent';
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress sx={{ color: '#ff6b35' }} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading leaderboard...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" textAlign="center" gutterBottom>
        Global Leaderboard
      </Typography>
      <Typography variant="h6" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
        Top players ranked by total winnings
      </Typography>

      <Card>
        <CardContent>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Rank</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Player</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">Games Played</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">Win Rate</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">Total Won</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">Profit/Loss</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leaderboard.map((player, index) => {
                  const rank = index + 1;
                  return (
                    <TableRow
                      key={player.id}
                      sx={{
                        '&:nth-of-type(odd)': { backgroundColor: '#fafafa' },
                        backgroundColor: rank <= 3 ? `${getRankColor(rank)}15` : 'inherit',
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', minWidth: 30 }}>
                            #{rank}
                          </Typography>
                          {getRankIcon(rank)}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: '#ff6b35' }}>
                            {player.username.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            {player.username}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        {player.totalGamesPlayed}
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`${player.winRate}%`}
                          size="small"
                          sx={{
                            backgroundColor: parseFloat(player.winRate) >= 50 ? '#4caf50' : '#f44336',
                            color: 'white',
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography sx={{ color: '#4caf50', fontWeight: 'medium' }}>
                          +{player.totalWon.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                          <TrendingUp
                            sx={{
                              color: player.profitLoss >= 0 ? '#4caf50' : '#f44336',
                              fontSize: 16
                            }}
                          />
                          <Typography
                            sx={{
                              color: player.profitLoss >= 0 ? '#4caf50' : '#f44336',
                              fontWeight: 'medium'
                            }}
                          >
                            {player.profitLoss >= 0 ? '+' : ''}{player.profitLoss.toFixed(2)}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {leaderboard.length === 0 && (
            <Box textAlign="center" sx={{ py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                No players found. Be the first to play and claim the top spot!
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Rankings are updated in real-time as players complete games.
        </Typography>
      </Box>
    </Container>
  );
};

export default Leaderboard;
