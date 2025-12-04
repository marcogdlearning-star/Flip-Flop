// src/App.jsx — FINAL: TRUE GASLESS PLAY – NO METAMASK POPUP, USES VAULT ONLY
import React, { useState } from 'react';
import WalletConnect from './components/WalletConnect';
import GameModeSelector from './components/GameModeSelector';
import GamePlay from './components/GamePlay';
import GameResult from './components/GameResult';
import DepositModal from './components/DepositModal';
import WithdrawModal from './components/WithdrawModal';
import { useVault } from './hooks/useVault';
import { ethers } from 'ethers';
import { GAME_ADDRESS } from './utils/constants.js';
import confetti from 'canvas-confetti';
import useSound from 'use-sound';

const GAME_ABI = [
  // This is the correct function your game contract uses internally
  "function playFromVault(uint256 wagerInFLIP, uint8 playerMove) external",
  "event GameResolved(uint256 indexed gameId, uint8 playerMove, uint8 houseMove, uint8 outcome, uint256 payout)"
];

const MAX_WAGER = 10000;

export default function App() {
  const [account, setAccount] = useState(null);
  const [gameMode, setGameMode] = useState(null);
  const [choice, setChoice] = useState(null);
  const [wager, setWager] = useState('');
  const [gameResult, setGameResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  const { inAppBalance, updateBalance } = useVault(account);

  const [playWin] = useSound('/sounds/win.mp3', { volume: 0.9 });
  const [playLose] = useSound('/sounds/lose.mp3', { volume: 0.7 });

  const handleConnect = (addr) => setAccount(addr);

  const playNow = async () => {
    if (isProcessing || choice === null || !wager) return;

    const wagerNum = parseInt(wager);
    if (wagerNum <= 0 || wagerNum > parseInt(inAppBalance || '0')) {
      return alert('Invalid wager');
    }

    setIsProcessing(true);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const gameContract = new ethers.Contract(GAME_ADDRESS, GAME_ABI, signer);

      // THIS IS THE CORRECT FUNCTION — USES VAULT DIRECTLY
      // No token transfer → NO MetaMask popup!
      const tx = await gameContract.playFromVault(wagerNum, choice, {
        gasLimit: 300000
      });

      const receipt = await tx.wait();

      // Find result
      const iface = new ethers.Interface(GAME_ABI);
      let event = null;
      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog(log);
          if (parsed?.name === 'GameResolved') {
            event = parsed;
            break;
          }
        } catch {}
      }

      if (!event) throw new Error("Result not found");

      const { playerMove, houseMove, outcome, payout } = event.args;
      const won = outcome === 0n;
      const tie = outcome === 2n;

      setGameResult({
        playerChoice: Number(playerMove),
        houseChoice: Number(houseMove),
        result: won ? 'win' : tie ? 'tie' : 'lose',
        payout: Number(payout),
        wager: wagerNum
      });

      if (won) {
        confetti({ particleCount: 400, spread: 140, origin: { y: 0.6 } });
        playWin();
      } else if (!tie) {
        playLose();
      }

    } catch (err) {
      console.error(err);
      alert(err.message || "Play failed");
    } finally {
      setTimeout(() => updateBalance?.(), 3000);
      setIsProcessing(false);
    }
  };

  if (!account) return <WalletConnect onConnect={handleConnect} />;

  if (gameResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
        <GameResult
          gameResult={gameResult}
          tokenSymbol="FLIP"
          onPlayAgain={() => {
            setGameResult(null);
            setChoice(null);
            setWager('');
            updateBalance?.();
          }}
          onBackToMenu={() => {
            setGameResult(null);
            setGameMode(null);
            updateBalance?.();
          }}
        />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="max-w-md mx-auto p-6">
          <div className="bg-gray-800 rounded-3xl p-6 mb-6 shadow-2xl border border-purple-600">
            <div className="flex justify-between items-center mb-4">
              <button onClick={() => setGameMode(null)} className="text-gray-400 hover:text-white">
                Back
              </button>
              <h1 className="text-2xl font-bold text-white">FLIP Game</h1>
              <div className="text-right">
                <p className="text-sm text-gray-400">In-App Balance</p>
                <p className="text-3xl font-bold text-green-400">
                  {inAppBalance || '0'} FLIP
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <button onClick={() => setShowDeposit(true)} className="bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-bold">
                Deposit
              </button>
              <button onClick={() => setShowWithdraw(true)} className="bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-bold">
                Withdraw
              </button>
            </div>
          </div>

          {!gameMode ? (
            <GameModeSelector balance={inAppBalance || '0'} onSelectMode={setGameMode} />
          ) : (
            <GamePlay
              balance={inAppBalance || '0'}
              tokenSymbol="FLIP"
              choice={choice}
              wager={wager}
              isProcessing={isProcessing}
              maxWager={MAX_WAGER}
              onChoiceSelect={setChoice}
              onWagerChange={setWager}
              onPlayGame={playNow}
              onBack={() => setGameMode(null)}
              updateBalance={updateBalance}
            />
          )}
        </div>
      </div>

      {showDeposit && <DepositModal onClose={() => setShowDeposit(false)} onSuccess={updateBalance} />}
      {showWithdraw && <WithdrawModal balance={inAppBalance || '0'} onClose={() => setShowWithdraw(false)} onWithdrawSuccess={updateBalance} />}
    </>
  );
}