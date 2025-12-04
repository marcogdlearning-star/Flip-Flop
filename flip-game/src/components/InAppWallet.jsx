// src/components/InAppWallet.jsx
import React, { useState } from 'react';
import { ethers } from 'ethers';

const InAppWallet = ({
  inAppBalance,
  tokenSymbol,
  tokenContract,
  gameAddress,
  account,
  onBalanceUpdate
}) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const deposit = async () => {
    if (!amount || parseFloat(amount) <= 0) return alert('Enter amount');
    setLoading(true);
    try {
      const tx = await tokenContract.transfer(gameAddress, ethers.parseUnits(amount, 18));
      await tx.wait();
      alert(`Deposited ${amount} ${tokenSymbol}!`);
      setAmount('');
      onBalanceUpdate();
    } catch (err) {
      alert(err?.reason || 'Deposit failed');
    }
    setLoading(false);
  };

  const withdraw = async () => {
    if (!amount || parseFloat(amount) <= 0 || parseFloat(amount) > inAppBalance) return alert('Invalid amount');
    setLoading(true);
    try {
      // This requires your game contract to have a withdraw function for players
      // Add this to your contract if not present:
      // function withdraw(uint256 amount) external { flipToken.transfer(msg.sender, amount); }
      const tx = await window.gameContract.withdraw(ethers.parseUnits(amount, 18));
      await tx.wait();
      alert(`Withdrew ${amount} ${tokenSymbol}!`);
      setAmount('');
      onBalanceUpdate();
    } catch (err) {
      alert(err?.reason || 'Withdraw not supported yet');
    }
    setLoading(false);
  };

  return (
    <div className="bg-gray-800 rounded-3xl p-6 mb-6">
      <h3 className="text-2xl font-bold text-white mb-4">In-App Wallet</h3>
      <div className="text-3xl font-bold text-purple-400 mb-4">
        {parseFloat(inAppBalance || 0).toFixed(2)} {tokenSymbol}
      </div>

      <input
        type="number"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        placeholder="Amount"
        className="w-full px-4 py-3 bg-gray-700 text-white rounded-xl mb-4"
      />

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={deposit}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold"
        >
          {loading ? '...' : 'Deposit'}
        </button>
        <button
          onClick={withdraw}
          disabled={loading || !inAppBalance}
          className="bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold disabled:opacity-50"
        >
          {loading ? '...' : 'Withdraw'}
        </button>
      </div>
    </div>
  );
};

export default InAppWallet;