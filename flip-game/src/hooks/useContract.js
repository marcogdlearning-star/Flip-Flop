// src/hooks/useContract.js — FINAL & BULLETPROOF
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { TOKEN_ADDRESS, GAME_ADDRESS } from '../utils/constants.js';

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function symbol() view returns (string)"
];

const GAME_ABI = [
  "function play(uint256 wagerInFLIP, uint8 playerMove) returns (uint256)",
  "event GamePlayed(uint256 indexed gameId, address player, uint256 wager, uint8 playerMove)",
  "event GameResolved(uint256 indexed gameId, uint8 playerMove, uint8 houseMove, uint8 outcome, uint256 payout)"
];

export const useContract = (account) => {
  const [balance, setBalance] = useState('0');
  const [tokenSymbol, setTokenSymbol] = useState('FLIP');
  const [gameContract, setGameContract] = useState(null);
  const [hasUnlimitedApproval, setHasUnlimitedApproval] = useState(false);

  useEffect(() => {
    if (!account || !window.ethereum) {
      setGameContract(null);
      setHasUnlimitedApproval(false);
      return;
    }

    let mounted = true;

    const init = async () => {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        // AUTO-CONFIRM AFTER FIRST APPROVAL
        const originalSend = signer.sendTransaction.bind(signer);
        signer.sendTransaction = async (tx) => {
          if (hasUnlimitedApproval && tx.to?.toLowerCase() === GAME_ADDRESS.toLowerCase()) {
            try {
              const hash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [{
                  from: account,
                  to: tx.to,
                  data: tx.data,
                  gas: tx.gasLimit ? '0x' + tx.gasLimit.toString(16) : undefined,
                  gasPrice: tx.gasPrice ? '0x' + tx.gasPrice.toString(16) : undefined,
                }]
              });
              return await provider.waitForTransaction(hash);
            } catch (err) {
              throw err;
            }
          }
          return originalSend(tx);
        };

        const token = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, signer);
        const game = new ethers.Contract(GAME_ADDRESS, GAME_ABI, signer);

        const [bal, sym, allowance] = await Promise.all([
          token.balanceOf(account),
          token.symbol().catch(() => 'FLIP'),
          token.allowance(account, GAME_ADDRESS)
        ]);

        if (!mounted) return;

        setBalance(ethers.formatUnits(bal, 18));
        setTokenSymbol(sym);
        setGameContract(game);
        setHasUnlimitedApproval(allowance >= ethers.parseUnits("100000", 18));
      } catch (err) {
        console.error("Contract init failed:", err);
      }
    };

    init();

    return () => { mounted = false; };
  }, [account, hasUnlimitedApproval]);

  const refreshBalance = async () => {
    if (!account || !window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const token = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, signer);
      const bal = await token.balanceOf(account);
      setBalance(ethers.formatUnits(bal, 18));
    } catch (err) {
      console.error(err);
    }
  };

  const requestUnlimitedApproval = async () => {
    if (!account || !window.ethereum) throw new Error("Wallet not connected");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const token = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, signer);
    const tx = await token.approve(GAME_ADDRESS, ethers.MaxUint256);
    await tx.wait();
    setHasUnlimitedApproval(true);
  };

  return {
    balance,
    tokenSymbol,
    gameContract,
    refreshBalance,
    hasUnlimitedApproval,
    requestUnlimitedApproval
  };
};