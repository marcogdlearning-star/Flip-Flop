import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';

interface Web3ContextType {
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  account: string | null;
  chainId: number | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isConnecting: boolean;
  contracts: {
    token?: ethers.Contract;
    userRegistry?: ethers.Contract;
    randomnessManager?: ethers.Contract;
    gameVerification?: ethers.Contract;
    tournamentManager?: ethers.Contract;
  };
  switchToBaseSepolia: () => Promise<void>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

interface Web3ProviderProps {
  children: ReactNode;
}

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [contracts, setContracts] = useState<Web3ContextType['contracts']>({});

  // Base Sepolia network configuration
  const BASE_SEPOLIA_CHAIN_ID = 84532;
  const BASE_SEPOLIA_PARAMS = {
    chainId: `0x${BASE_SEPOLIA_CHAIN_ID.toString(16)}`,
    chainName: 'Base Sepolia',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://sepolia.base.org'],
    blockExplorerUrls: ['https://sepolia.basescan.org'],
  };

  const connectWallet = async () => {
    try {
      setIsConnecting(true);

      const ethereumProvider = await detectEthereumProvider();
      if (!ethereumProvider) {
        throw new Error('MetaMask not found. Please install MetaMask extension.');
      }

      // Request account access
      await (ethereumProvider as any).request({ method: 'eth_requestAccounts' });

      const web3Provider = new ethers.BrowserProvider(ethereumProvider as any);
      const web3Signer = await web3Provider.getSigner();
      const userAddress = await web3Signer.getAddress();
      const network = await web3Provider.getNetwork();

      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(userAddress);
      setChainId(Number(network.chainId));

      // Initialize contracts
      await initializeContracts(web3Provider);

      // Switch to Base Sepolia if not already on it
      if (Number(network.chainId) !== BASE_SEPOLIA_CHAIN_ID) {
        await switchToBaseSepolia();
      }

    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      throw new Error(error.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setChainId(null);
    setContracts({});
  };

  const switchToBaseSepolia = async () => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BASE_SEPOLIA_PARAMS.chainId }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [BASE_SEPOLIA_PARAMS],
          });
        } catch (addError) {
          throw new Error('Failed to add Base Sepolia network to MetaMask');
        }
      } else {
        throw new Error('Failed to switch to Base Sepolia network');
      }
    }
  };

  const initializeContracts = async (web3Provider: ethers.BrowserProvider) => {
    try {
      // Import ABIs (we'll create these next)
      const { FlipFlopTokenABI } = await import('../abis/FlipFlopToken');
      const { UserRegistryABI } = await import('../abis/UserRegistry');
      const { RandomnessManagerABI } = await import('../abis/RandomnessManager');
      const { GameVerificationABI } = await import('../abis/GameVerification');
      const { TournamentManagerABI } = await import('../abis/TournamentManager');

      const newContracts: Web3ContextType['contracts'] = {};

      // Initialize contracts with deployed addresses from environment
      if (process.env.REACT_APP_TOKEN_ADDRESS) {
        newContracts.token = new ethers.Contract(
          process.env.REACT_APP_TOKEN_ADDRESS,
          FlipFlopTokenABI,
          web3Provider
        );
      }

      if (process.env.REACT_APP_USER_REGISTRY_ADDRESS) {
        newContracts.userRegistry = new ethers.Contract(
          process.env.REACT_APP_USER_REGISTRY_ADDRESS,
          UserRegistryABI,
          web3Provider
        );
      }

      if (process.env.REACT_APP_RANDOMNESS_MANAGER_ADDRESS) {
        newContracts.randomnessManager = new ethers.Contract(
          process.env.REACT_APP_RANDOMNESS_MANAGER_ADDRESS,
          RandomnessManagerABI,
          web3Provider
        );
      }

      if (process.env.REACT_APP_GAME_VERIFICATION_ADDRESS) {
        newContracts.gameVerification = new ethers.Contract(
          process.env.REACT_APP_GAME_VERIFICATION_ADDRESS,
          GameVerificationABI,
          web3Provider
        );
      }

      if (process.env.REACT_APP_TOURNAMENT_MANAGER_ADDRESS) {
        newContracts.tournamentManager = new ethers.Contract(
          process.env.REACT_APP_TOURNAMENT_MANAGER_ADDRESS,
          TournamentManagerABI,
          web3Provider
        );
      }

      setContracts(newContracts);
    } catch (error) {
      console.error('Failed to initialize contracts:', error);
    }
  };

  // Listen for account and chain changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          disconnectWallet();
        }
      };

      const handleChainChanged = (chainIdHex: string) => {
        const newChainId = parseInt(chainIdHex, 16);
        setChainId(newChainId);

        // Re-initialize contracts on network change
        if (provider) {
          initializeContracts(provider);
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [provider]);

  // Auto-connect if previously connected
  useEffect(() => {
    const autoConnect = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            await connectWallet();
          }
        } catch (error) {
          console.error('Auto-connect failed:', error);
        }
      }
    };

    autoConnect();
  }, []);

  const value: Web3ContextType = {
    provider,
    signer,
    account,
    chainId,
    connectWallet,
    disconnectWallet,
    isConnecting,
    contracts,
    switchToBaseSepolia,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

// Extend window.ethereum type
declare global {
  interface Window {
    ethereum?: any;
  }
}
