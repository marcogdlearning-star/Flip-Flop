// src/components/WithdrawModal.jsx
import React, { useState } from 'react';
import { Loader } from 'lucide-react';
import { ethers } from 'ethers';
import { VAULT_ADDRESS } from '../utils/constants.js';

export default function WithdrawModal({ balance, onClose, onWithdrawSuccess }) {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const wholeBalance = parseInt(balance || '0');

  const handleWithdraw = async () => {
    const raw = amount.trim();
    if (!raw || !/^\d+$/.test(raw) || parseInt(raw) <= 0) {
      return alert('Enter a whole number');
    }
    if (parseInt(raw) > wholeBalance) {
      return alert('Not enough balance');
    }

    setIsLoading(true);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const vault = new ethers.Contract(VAULT_ADDRESS, ["function withdraw(uint256)"], signer);

      // Send exact raw integer
      await (await vault.withdraw(raw)).wait(1);

      alert(`Withdrew ${raw} FLIP to your wallet!`);
      onWithdrawSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      alert(err?.reason || err.message || 'Withdraw failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-3xl p-8 max-w-md w-full border-4 border-red-600 shadow-2xl">
        <h2 className="text-4xl font-bold text-white text-center mb-8">Withdraw FLIP</h2>

        <div className="text-center mb-6">
          <p className="text-gray-400 text-sm">In-App Balance</p>
          <p className="text-4xl font-bold text-green-400">{wholeBalance} FLIP</p>
        </div>

        <input
          type="text"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder="e.g. 50"
          className="w-full px-6 py-5 bg-gray-800 text-white text-3xl text-center rounded-2xl mb-6 placeholder-gray-500"
          disabled={isLoading}
        />

        <button
          onClick={handleWithdraw}
          disabled={isLoading || !amount || parseInt(amount) > wholeBalance}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white py-6 rounded-2xl text-2xl font-bold flex items-center justify-center gap-3"
        >
          {isLoading ? <Loader className="animate-spin" size={28} /> : `Withdraw ${amount || ''} FLIP`}
        </button>

        <button
          onClick={onClose}
          disabled={isLoading}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white py-4 rounded-2xl text-xl font-bold mt-4"
        >
          Cancel
        </button>

        <p className="text-center text-xs text-gray-500 mt-6">
          <strong>Whole tokens only • Exact amount withdrawn</strong>
        </p>
      </div>
    </div>
  );
}