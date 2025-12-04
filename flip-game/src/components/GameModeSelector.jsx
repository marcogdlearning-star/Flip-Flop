// src/components/GameModeSelector.jsx
import React from 'react';
import { Home, Users, Smartphone, Wifi } from 'lucide-react';

const GameModeSelector = ({ balance, tokenSymbol = 'FLIP', onSelectMode }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-gray-800 rounded-3xl shadow-2xl p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-white">FLIP Game</h1>
            <div className="text-green-400 flex items-center gap-2">
              <Wifi size={18} />
              <span className="text-sm">Connected</span>
            </div>
          </div>
          <div className="bg-gray-700 rounded-2xl p-5">
            <div className="text-sm text-gray-400 mb-1">Your Balance</div>
            <div className="text-3xl font-bold text-white">
              {parseFloat(balance || 0).toFixed(2)} {tokenSymbol}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <button
            onClick={() => onSelectMode('rps')}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white p-8 rounded-3xl shadow-xl transition-all transform hover:scale-105 active:scale-95"
          >
            <div className="flex flex-col items-center">
              <Home size={48} className="mb-4" />
              <div className="text-2xl font-bold">Play vs House</div>
              <div className="text-purple-200 text-sm mt-1">Instant Rock Paper Scissors</div>
            </div>
          </button>

          <button disabled className="w-full bg-gray-700 text-gray-500 p-8 rounded-3xl opacity-60 cursor-not-allowed">
            <div className="flex flex-col items-center">
              <Users size={48} className="mb-4" />
              <div className="text-2xl font-bold">Play Online</div>
              <div className="text-gray-400 text-sm mt-1">Coming Soon</div>
            </div>
          </button>

          <button disabled className="w-full bg-gray-700 text-gray-500 p-8 rounded-3xl opacity-60 cursor-not-allowed">
            <div className="flex flex-col items-center">
              <Smartphone size={48} className="mb-4" />
              <div className="text-2xl font-bold">Play via NFC</div>
              <div className="text-gray-400 text-sm mt-1">Coming Soon</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameModeSelector;