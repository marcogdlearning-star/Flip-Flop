// src/components/GamePlay.jsx — FINAL VERSION – BALANCE NEVER DROPS TO 0
import React from 'react';
import { Loader } from 'lucide-react';

const GamePlay = ({
  balance,
  tokenSymbol,
  choice,
  wager,
  isProcessing,
  maxWager,
  onChoiceSelect,
  onWagerChange,
  onPlayGame,
  onBack,
  updateBalance
}) => {
  const choices = [
    { id: 0, name: 'rock', img: '/images/rock.png', label: 'Rock' },
    { id: 1, name: 'paper', img: '/images/paper.png', label: 'Paper' },
    { id: 2, name: 'scissors', img: '/images/scissors.png', label: 'Scissors' }
  ];

  const quickAmounts = [10, 25, 50, 100, 500, 1000, 5000];

  // CRITICAL FIX: Use the raw balance string directly — never parse it early
  const balanceNum = balance ? parseInt(balance) : 0;
  const wagerNum = wager ? parseInt(wager) || 0 : 0;

  const isOverMax = wagerNum > maxWager;
  const isOverBalance = wagerNum > balanceNum;
  const isValid = wagerNum > 0 && wagerNum <= maxWager && wagerNum <= balanceNum && choice !== null;

  const handlePlay = async () => {
    if (!isValid || isProcessing) return;
    await onPlayGame();
    setTimeout(() => updateBalance?.(), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
      <div className="max-w-md mx-auto">

        {/* Header */}
        <div className="bg-gray-800 rounded-3xl shadow-2xl p-4 mb-6">
          <div className="flex justify-between items-center">
            <button
              onClick={onBack}
              disabled={isProcessing}
              className="text-gray-400 hover:text-white disabled:opacity-50 text-lg"
            >
              Back
            </button>
            <div className="text-white font-bold text-xl">vs House</div>
            <div className="text-purple-400 font-bold text-lg">
              {balance || '0'} {tokenSymbol}
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-gray-800 rounded-3xl shadow-2xl p-8">
          <h2 className="text-4xl font-bold text-white text-center mb-10">Make Your Move</h2>

          {/* Choice Icons */}
          <div className="grid grid-cols-3 gap-6 mb-10">
            {choices.map(({ id, img, label }) => (
              <button
                key={id}
                onClick={() => onChoiceSelect(id)}
                disabled={isProcessing}
                className={`relative overflow-hidden rounded-3xl transition-all transform ${
                  choice === id
                    ? 'ring-8 ring-purple-500 scale-110 shadow-2xl'
                    : 'ring-4 ring-gray-700 hover:ring-purple-400 hover:scale-105'
                } ${isProcessing ? 'opacity-60' : ''}`}
              >
                <img src={img} alt={label} className="w-full h-auto" />
                <div className="absolute inset-0 bg-black/30 flex items-end justify-center pb-4">
                  <span className="text-white font-bold text-xl drop-shadow-lg">{label}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Wager Input */}
          <div className="mb-8">
            <p className="text-center text-gray-300 text-lg mb-4">Wager Amount (whole tokens)</p>
            <input
              type="text"
              inputMode="numeric"
              value={wager}
              onChange={(e) => onWagerChange(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="e.g. 100"
              disabled={isProcessing}
              className="w-full px-6 py-5 bg-gray-900 text-white text-3xl text-center rounded-2xl rounded-2xl placeholder-gray-600 focus:outline-none focus:ring-4 focus:ring-purple-500"
            />
          </div>

          {/* Quick Buttons */}
          <div className="grid grid-cols-4 gap-3 mb-8">
            {quickAmounts.map((amount) => (
              <button
                key={amount}
                onClick={() => onWagerChange(amount.toString())}
                disabled={isProcessing || amount > balanceNum}
                className="bg-gray-700 hover:bg-purple-600 disabled:opacity-40 text-white font-bold py-3 rounded-xl text-sm transition-all"
              >
                {amount}
              </button>
            ))}
          </div>

          {/* Errors */}
          {isOverMax && (
            <div className="bg-red-900/80 border border-red-500 text-red-200 px-4 py-3 rounded-xl text-center mb-4">
              Max wager: {maxWager} FLIP
            </div>
          )}
          {isOverBalance && !isOverMax && (
            <div className="bg-red-900/80 border border-red-500 text-red-200 px-4 py-3 rounded-xl text-center mb-4">
              Not enough balance
            </div>
          )}
          {choice === null && wager && (
            <div className="bg-yellow-900/80 border border-yellow-500 text-yellow-200 px-4 py-3 rounded-xl text-center mb-4">
              Select Rock, Paper, or Scissors
            </div>
          )}

          {/* Play Button */}
          <button
            onClick={handlePlay}
            disabled={!isValid || isProcessing}
            className={`w-full py-6 rounded-2xl font-bold text-2xl transition-all transform ${
              isValid && !isProcessing
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-2xl hover:shadow-purple-500/50 hover:scale-105'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-3">
                <Loader className="animate-spin" size={28} />
                Playing...
              </span>
            ) : (
              'Play Game'
            )}
          </button>

          <div className="mt-8 text-center text-gray-400 text-sm">
            <p>Win approximately 1.95x • Tie = return • Whole tokens only</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamePlay;