import React from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Box,
  Chip,
} from '@mui/material';
import {
  Casino,
  EmojiEvents,
  Leaderboard,
  Security,
  FlashOn,
  MonetizationOn,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Home: React.FC = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: <FlashOn sx={{ fontSize: 40, color: '#ff6b35' }} />,
      title: 'Gas-Free Gaming',
      description: 'Play unlimited games without paying gas fees. All transactions happen off-chain.',
    },
    {
      icon: <Security sx={{ fontSize: 40, color: '#ff6b35' }} />,
      title: 'Provable Fairness',
      description: 'Every game outcome is cryptographically verified using Chainlink VRF.',
    },
    {
      icon: <MonetizationOn sx={{ fontSize: 40, color: '#ff6b35' }} />,
      title: 'Proprietary Tokens',
      description: 'Use in-game tokens for all gameplay. No real cryptocurrency required.',
    },
    {
      icon: <Casino sx={{ fontSize: 40, color: '#ff6b35' }} />,
      title: 'Rock-Paper-Scissors',
      description: 'Classic game with modern twists. Play vs house or compete in tournaments.',
    },
  ];

  const gameModes = [
    {
      title: 'Play vs House',
      description: 'Challenge the house in Rock-Paper-Scissors with instant payouts.',
      icon: <Casino sx={{ fontSize: 48, color: '#ff6b35' }} />,
      link: '/game',
      available: true,
    },
    {
      title: 'Tournaments',
      description: 'Compete in paid entry tournaments with prize pools.',
      icon: <EmojiEvents sx={{ fontSize: 48, color: '#ff6b35' }} />,
      link: '/tournaments',
      available: false,
    },
    {
      title: 'Internet Mode',
      description: 'Real-time multiplayer games with other players.',
      icon: <Leaderboard sx={{ fontSize: 48, color: '#ff6b35' }} />,
      link: '/game',
      available: false,
    },
    {
      title: 'NFC Mode',
      description: 'Proximity-based gaming using NFC technology.',
      icon: <Security sx={{ fontSize: 48, color: '#ff6b35' }} />,
      link: '/game',
      available: false,
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Hero Section */}
      <Box textAlign="center" sx={{ mb: 6 }}>
        <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Welcome to <span style={{ color: '#ff6b35' }}>FlipFlop</span>
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
          The future of gaming: Gas-free, fair, and fun Rock-Paper-Scissors
        </Typography>

        {user ? (
          <Button
            variant="contained"
            size="large"
            component={Link}
            to="/game"
            sx={{
              backgroundColor: '#ff6b35',
              '&:hover': { backgroundColor: '#e55a2b' },
              px: 4,
              py: 1.5,
              fontSize: '1.2rem',
            }}
          >
            Start Playing Now
          </Button>
        ) : (
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              size="large"
              component={Link}
              to="/register"
              sx={{
                backgroundColor: '#ff6b35',
                '&:hover': { backgroundColor: '#e55a2b' },
                px: 4,
                py: 1.5,
              }}
            >
              Get Started
            </Button>
            <Button
              variant="outlined"
              size="large"
              component={Link}
              to="/login"
              sx={{
                borderColor: '#ff6b35',
                color: '#ff6b35',
                '&:hover': { borderColor: '#e55a2b', color: '#e55a2b' },
                px: 4,
                py: 1.5,
              }}
            >
              Login
            </Button>
          </Box>
        )}
      </Box>

      {/* Features Section */}
      <Typography variant="h3" component="h2" textAlign="center" sx={{ mb: 4 }}>
        Why Choose FlipFlop?
      </Typography>
      <Grid container spacing={4} sx={{ mb: 6 }}>
        {features.map((feature, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
              <CardContent>
                <Box sx={{ mb: 2 }}>
                  {feature.icon}
                </Box>
                <Typography variant="h6" component="h3" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Game Modes Section */}
      <Typography variant="h3" component="h2" textAlign="center" sx={{ mb: 4 }}>
        Game Modes
      </Typography>
      <Grid container spacing={4}>
        {gameModes.map((mode, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ height: '100%', position: 'relative' }}>
              {!mode.available && (
                <Chip
                  label="Coming Soon"
                  sx={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    backgroundColor: '#666',
                    color: 'white',
                    zIndex: 1,
                  }}
                />
              )}
              <CardContent sx={{ textAlign: 'center', pt: 4 }}>
                <Box sx={{ mb: 2 }}>
                  {mode.icon}
                </Box>
                <Typography variant="h6" component="h3" gutterBottom>
                  {mode.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {mode.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                <Button
                  variant="contained"
                  component={Link}
                  to={mode.link}
                  disabled={!mode.available}
                  sx={{
                    backgroundColor: mode.available ? '#ff6b35' : '#666',
                    '&:hover': {
                      backgroundColor: mode.available ? '#e55a2b' : '#666'
                    },
                    '&:disabled': {
                      backgroundColor: '#666',
                    },
                  }}
                >
                  {mode.available ? 'Play Now' : 'Coming Soon'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Stats Section */}
      {user && (
        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Typography variant="h4" component="h2" gutterBottom>
            Ready to Play?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Join thousands of players in the most exciting gaming experience on Base.
          </Typography>
          <Button
            variant="contained"
            size="large"
            component={Link}
            to="/game"
            sx={{
              backgroundColor: '#ff6b35',
              '&:hover': { backgroundColor: '#e55a2b' },
              px: 4,
              py: 1.5,
            }}
          >
            Start Your First Game
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default Home;
