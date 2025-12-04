// src/components/GameResult.jsx
import React from 'react';

const RockIcon = () => <img src="/images/rock.png" alt="Rock" className="w-32 h-32" />;
const PaperIcon = () => <img src="/images/paper.png" alt="Paper" className="w-32 h-32" />;
const ScissorsIcon = () => <img src="/images/scissors.png" alt="Scissors" className="w-32 h-32" />;

const getMoveIcon = (move) => {
  const num = Number(move);
  switch (num) {
    case 0: return <RockIcon />;
    case 1: return <PaperIcon />;
    case 2: return <ScissorsIcon />;
    default: return <div className="text-6xl opacity-30">?</div>;
  }
};

export default function GameResult({ gameResult, tokenSymbol = 'FLIP', onPlayAgain, onBackToMenu }) {
  const { playerChoice, houseChoice, result, payout, wager } = gameResult;
  const isWin = result === 'win';
  const isTie = result === 'tie';

  return (
    <div className="bg-black/90 backdrop-blur-xl rounded-3xl p-12 max-w-lg w-full border-4 border-purple-600 shadow-2xl">
      <h2 className={`text-6xl font-bold text-center mb-12 ${
        isWin ? 'text-green-400' : isTie ? 'text-yellow-400' : 'text-red-400'
      }`}>
        {isWin ? 'YOU WIN!' : isTie ? "IT'S A TIE" : 'YOU LOSE'}
      </h2>

      <div className="flex justify-center items-center gap-20 mb-12">
        <div className="text-center">
          <p className="text-xl text-gray-300 mb-4">You</p>
          {getMoveIcon(playerChoice)}
        </div>

        <div className="text-5xl font-bold text-gray-500">VS</div>

        <div className="text-center">
          <p className="text-xl text-gray-300 mb-4">House</p>
          {getMoveIcon(houseChoice)}
        </div>
      </div>

      <div className="bg-gray-900/80 rounded-2xl p-8 text-center mb-10">
        <p className="text-2xl text-gray-300">Wager: <span className="text-4xl font-bold text-white">{wager} {tokenSymbol}</span></p>
        <p className={`text-5xl font-bold mt-6 ${
          isWin ? 'text-green-400' : isTie ? 'text-yellow-400' : 'text-red-400'
        }`}>
          {isWin ? `+${payout.toFixed(2)} ${tokenSymbol}` : isTie ? 'Wager Returned' : 'Lost'}
        </p>
      </div>

      <div className="space-y-4">
        <button
          onClick={onPlayAgain}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-6 rounded-2xl text-2xl font-bold hover:scale-105 transition-all shadow-lg"
        >
          Play Again
        </button>
        <button
          onClick={onBackToMenu}
          className="w-full bg-gray-700 text-gray-300 py-4 rounded-2xl text-xl hover:bg-gray-600 transition-all"
        >
          Back to Menu
        </button>
      </div>
    </div>
  );
}