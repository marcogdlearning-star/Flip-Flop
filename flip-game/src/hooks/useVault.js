// src/hooks/useVault.js — THIS IS THE ONLY FILE YOU NEED TO REPLACE
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { VAULT_ADDRESS } from '../utils/constants.js';

const VAULT_ABI = [
  "function balances(address) view returns (uint256)",
  "event Deposited(address indexed player, uint256 amount)",
  "event Withdrawn(address indexed player, uint256 amount)"
];

export const useVault = (account) => {
  const [inAppBalance, setInAppBalance] = useState('0');
  const [vaultContract, setVaultContract] = useState(null);

  const fetchBalance = async () => {
    if (!vaultContract || !account) {
      setInAppBalance('0');
      return;
    }

    try {
      const bal = await vaultContract.balances(account);
      // Convert BigInt to string safely
      const balanceStr = bal.toString();
      setInAppBalance(balanceStr);
    } catch (err) {
      console.warn("Balance fetch failed, will retry...", err);
      setTimeout(fetchBalance, 2000);
    }
  };

  useEffect(() => {
    if (!account || !window.ethereum) {
      setVaultContract(null);
      setInAppBalance('0');
      return;
    }

    const init = async () => {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer);
        setVaultContract(vault);

        await fetchBalance();
      } catch (err) {
        console.error("Vault connection failed:", err);
        setInAppBalance('0');
      }
    };

    init();
  }, [account]);

  useEffect(() => {
    if (!vaultContract || !account) return;

    const handleEvent = (player, amount) => {
      if (player.toLowerCase() === account.toLowerCase()) {
        fetchBalance();
      }
    };

    vaultContract.on("Deposited", handleEvent);
    vaultContract.on("Withdrawn", handleEvent);

    return () => {
      vaultContract.off("Deposited", handleEvent);
      vaultContract.off("Withdrawn", handleEvent);
    };
  }, [vaultContract, account]);

  useEffect(() => {
    if (!account) return;
    const interval = setInterval(() => {
      fetchBalance();
    }, 8000);
    return () => clearInterval(interval);
  }, [account, vaultContract]);

  const updateBalance = () => fetchBalance();

  return {
    inAppBalance,     
    updateBalance
  };
};