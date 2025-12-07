import React from 'react';
import { Button, Box, Typography, Chip, Alert } from '@mui/material';
import { useWeb3 } from '../contexts/Web3Context';

const WalletConnect: React.FC = () => {
  const { account, chainId, connectWallet, disconnectWallet, isConnecting, switchToBaseSepolia } = useWeb3();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getNetworkName = (chainId: number) => {
    switch (chainId) {
      case 84532: return 'Base Sepolia';
      case 8453: return 'Base Mainnet';
      default: return 'Unknown Network';
    }
  };

  const getNetworkColor = (chainId: number) => {
    switch (chainId) {
      case 84532: return 'primary';
      case 8453: return 'success';
      default: return 'error';
    }
  };

  const isOnCorrectNetwork = chainId === 84532;

  if (account) {
    return (
      <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
        <Chip
          label={getNetworkName(chainId!)}
          color={getNetworkColor(chainId!) as any}
          size="small"
        />
        <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
          {formatAddress(account)}
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={disconnectWallet}
        >
          Disconnect
        </Button>

        {!isOnCorrectNetwork && (
          <Alert severity="warning" sx={{ mt: 1, width: '100%' }}>
            Please switch to Base Sepolia network to play games.
            <Button
              size="small"
              onClick={switchToBaseSepolia}
              sx={{ ml: 1 }}
            >
              Switch Network
            </Button>
          </Alert>
        )}
      </Box>
    );
  }

  return (
    <Box>
      <Button
        variant="contained"
        onClick={connectWallet}
        disabled={isConnecting}
        size="large"
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Connect your MetaMask wallet to start playing on Base Sepolia
      </Typography>
    </Box>
  );
};

export default WalletConnect;
