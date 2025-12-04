// src/components/DepositModal.jsx — FINAL & WORKING
import React, { useState } from 'react';
import { Loader } from 'lucide-react';
import { ethers } from 'ethers';
import { TOKEN_ADDRESS, VAULT_ADDRESS } from '../utils/constants.js';

const TOKEN_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address) view returns (uint256)"
];

const VAULT_ABI = [
  "function deposit(uint256 amount) external"
];

export default function DepositModal({ onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDeposit = async () => {
    const raw = amount.trim();
    if (!raw || !/^\d+$/.test(raw) || raw === '0') {
      return alert('Enter a whole number > 0');
    }

    setIsLoading(true);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const user = await signer.getAddress();

      const token = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
      const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer);

      // 1. Check wallet has enough FLIP
      const walletBal = await token.balanceOf(user);
      if (walletBal < BigInt(raw)) {
        return alert(`You only have ${ethers.formatUnits(walletBal, 18)} FLIP in wallet`);
      }

      // 2. Approve vault to spend FLIP (one-time)
      const allowance = await token.allowance(user, VAULT_ADDRESS);
      if (allowance < BigInt(raw)) {
        const approveTx = await token.approve(VAULT_ADDRESS, ethers.MaxUint256);
        await approveTx.wait(1);
      }

      // 3. Deposit — send raw whole number (55 FLIP = 55)
      const tx = await vault.deposit(raw);
      await tx.wait(1);

      alert(`Deposited ${raw} FLIP!`);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      alert(err?.reason || err.message || 'Deposit failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-3xl p-8 max-w-md w-full border-4 border-green-600 shadow-2xl">
        <h2 className="text-4xl font-bold text-white text-center mb-8">Deposit FLIP</h2>

        <input
          type="text"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder="e.g. 100"
          className="w-full px-6 py-5 bg-gray-800 text-white text-3xl text-center rounded-2xl mb-6 placeholder-gray-500"
          disabled={isLoading}
        />

        <button
          onClick={handleDeposit}
          disabled={isLoading || !amount}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white py-6 rounded-2xl text-2xl font-bold flex items-center justify-center gap-3"
        >
          {isLoading ? <Loader className="animate-spin" size={28} /> : `Deposit ${amount || ''} FLIP`}
        </button>

        <button
          onClick={onClose}
          disabled={isLoading}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white py-4 rounded-2xl text-xl font-bold mt-4"
        >
          Cancel
        </button>

        <p className="text-center text-xs text-gray-500 mt-6">
          <strong>Whole tokens only • First time needs 2 confirmations</strong>
        </p>
      </div>
    </div>
  );
}