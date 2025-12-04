// src/components/WalletConnect.jsx — FINAL (forces wallet selection every time)
import React from 'react';

export default function WalletConnect({ onConnect }) {
  const handleConnect = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask!');
      return;
    }

    try {
      // Force wallet chooser popup — works in MetaMask, Coinbase Wallet, etc.
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }],
      });

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        onConnect(accounts[0]);
      }
    } catch (err) {
      console.error("Wallet connection failed:", err);
      alert('Wallet connection cancelled or failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-3xl shadow-2xl p-12 max-w-md w-full text-center border-4 border-purple-600">
        <h1 className="text-6xl font-bold text-white mb-8">FLIP Game</h1>
        <p className="text-2xl text-gray-300 mb-12">Rock Paper Scissors</p>
        
        <button
          onClick={handleConnect}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-8 rounded-2xl text-3xl font-bold transition-all transform hover:scale-105 shadow-2xl"
        >
          Connect Wallet
        </button>

        <p className="text-gray-500 text-sm mt-8">
          Choose your wallet every time
        </p>
      </div>
    </div>
  );
}