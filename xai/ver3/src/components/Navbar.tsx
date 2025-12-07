import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  AccountCircle,
  Casino,
  Leaderboard,
  EmojiEvents,
  Login,
  PersonAdd,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import WalletConnect from './WalletConnect';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { stats } = useGame();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/');
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: '#1a1a1a' }}>
      <Toolbar>
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            color: 'inherit',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Casino sx={{ color: '#ff6b35' }} />
          FlipFlop
        </Typography>

        {user ? (
          <>
            {/* Navigation Links */}
            <Box sx={{ display: 'flex', gap: 2, mr: 2 }}>
              <Button
                color="inherit"
                component={Link}
                to="/game"
                startIcon={<Casino />}
              >
                Play
              </Button>
              <Button
                color="inherit"
                component={Link}
                to="/tournaments"
                startIcon={<EmojiEvents />}
              >
                Tournaments
              </Button>
              <Button
                color="inherit"
                component={Link}
                to="/leaderboard"
                startIcon={<Leaderboard />}
              >
                Leaderboard
              </Button>
            </Box>

            {/* User Info */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {stats && (
                <Chip
                  label={`${stats.currentBalance.toFixed(2)} tokens`}
                  sx={{
                    backgroundColor: '#ff6b35',
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                />
              )}

              <Typography variant="body1" sx={{ mr: 1 }}>
                {user.username}
              </Typography>

              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <AccountCircle />
              </IconButton>

              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem component={Link} to="/profile" onClick={handleClose}>
                  Profile
                </MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </Box>
          </>
        ) : (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              color="inherit"
              component={Link}
              to="/login"
              startIcon={<Login />}
            >
              Login
            </Button>
            <Button
              variant="contained"
              component={Link}
              to="/register"
              startIcon={<PersonAdd />}
              sx={{ backgroundColor: '#ff6b35' }}
            >
              Register
            </Button>
          </Box>
        )}

        {/* Wallet Connection - Always visible */}
        <Box sx={{ ml: 2 }}>
          <WalletConnect />
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
