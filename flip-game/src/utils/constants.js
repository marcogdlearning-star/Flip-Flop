export const TOKEN_ADDRESS = import.meta.env.VITE_TOKEN_ADDRESS;
export const GAME_ADDRESS = import.meta.env.VITE_GAME_ADDRESS;
export const VAULT_ADDRESS = import.meta.env.VITE_VAULT_ADDRESS;
export const CHAIN_ID = import.meta.env.VITE_CHAIN_ID;
export const RPC_URL = import.meta.env.VITE_RPC_URL;
export const FORWARDER_ADDRESS = import.meta.env.VITE_FORWARDER_ADDRESS; // ← YOUR DEPLOYED FORWARDER

export const BASE_SEPOLIA = {
  chainId: '0x14a34',
  chainName: 'Base Sepolia',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: ['https://sepolia.base.org'],
  blockExplorerUrls: ['https://sepolia-explorer.base.org']
};

export const CHOICES = {
  ROCK: 0,
  PAPER: 1,
  SCISSORS: 2
};

export const GAME_RESULTS = {
  WIN: 'win',
  LOSE: 'lose',
  TIE: 'tie'
};
