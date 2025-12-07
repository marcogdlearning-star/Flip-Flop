import React from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Box,
  Grid,
} from '@mui/material';
import { EmojiEvents, AccessTime, Group, MonetizationOn } from '@mui/icons-material';

const Tournaments: React.FC = () => {
  // Mock tournament data - in production this would come from API
  const tournaments = [
    {
      id: 1,
      name: 'Daily Championship',
      entryFee: 50,
      prizePool: 1000,
      maxParticipants: 32,
      currentParticipants: 18,
      status: 'registration',
      startTime: '2025-12-07T18:00:00Z',
      description: 'Daily tournament with big prizes',
    },
    {
      id: 2,
      name: 'Weekend Special',
      entryFee: 100,
      prizePool: 5000,
      maxParticipants: 64,
      currentParticipants: 45,
      status: 'registration',
      startTime: '2025-12-08T12:00:00Z',
      description: 'Weekend tournament with massive prize pool',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registration': return 'success';
      case 'active': return 'warning';
      case 'completed': return 'default';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'registration': return 'Open for Registration';
      case 'active': return 'In Progress';
      case 'completed': return 'Completed';
      default: return 'Unknown';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" textAlign="center" gutterBottom>
        Tournaments
      </Typography>
      <Typography variant="h6" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
        Compete in tournaments for bigger prizes and glory
      </Typography>

      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Tournaments are coming soon! Stay tuned for competitive play with real prizes.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {tournaments.map((tournament) => (
          <Grid item xs={12} md={6} key={tournament.id}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
                    {tournament.name}
                  </Typography>
                  <Chip
                    label={getStatusText(tournament.status)}
                    color={getStatusColor(tournament.status) as any}
                    size="small"
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {tournament.description}
                </Typography>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MonetizationOn sx={{ color: '#ff6b35', fontSize: 20 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Entry Fee
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {tournament.entryFee} tokens
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmojiEvents sx={{ color: '#ff6b35', fontSize: 20 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Prize Pool
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {tournament.prizePool} tokens
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Group sx={{ color: '#ff6b35', fontSize: 20 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Participants
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {tournament.currentParticipants}/{tournament.maxParticipants}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTime sx={{ color: '#ff6b35', fontSize: 20 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Starts
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {new Date(tournament.startTime).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    disabled={tournament.status !== 'registration'}
                    sx={{
                      backgroundColor: '#ff6b35',
                      '&:hover': { backgroundColor: '#e55a2b' },
                      '&:disabled': { backgroundColor: '#666' },
                    }}
                  >
                    {tournament.status === 'registration' ? 'Join Tournament' : 'Coming Soon'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 6, textAlign: 'center' }}>
        <Card sx={{ backgroundColor: '#f5f5f5' }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Tournament Features
            </Typography>
            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid item xs={12} sm={4}>
                <Box textAlign="center">
                  <EmojiEvents sx={{ fontSize: 48, color: '#ff6b35', mb: 1 }} />
                  <Typography variant="h6" gutterBottom>
                    Big Prizes
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Compete for large prize pools funded by entry fees and house contributions.
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box textAlign="center">
                  <Group sx={{ fontSize: 48, color: '#ff6b35', mb: 1 }} />
                  <Typography variant="h6" gutterBottom>
                    Fair Competition
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    All players start equal with the same game rules and random opponents.
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box textAlign="center">
                  <AccessTime sx={{ fontSize: 48, color: '#ff6b35', mb: 1 }} />
                  <Typography variant="h6" gutterBottom>
                    Scheduled Events
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Regular tournaments at fixed times for consistent competitive play.
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default Tournaments;
