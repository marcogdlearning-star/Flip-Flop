import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface Game {
  id?: number;
  gameId: string;
  gameType: string;
  status: string;
  wager: number;
  playerMove?: string;
  houseMove?: string;
  playerWon?: boolean;
  payout?: number;
  verified: boolean;
  createdAt: string;
  completedAt?: string;
}

interface GameStats {
  totalGamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  winRate: number;
  totalWagered: number;
  totalWon: number;
  profitLoss: number;
  currentBalance: number;
}

interface GameContextType {
  currentGame: Game | null;
  gameHistory: Game[];
  stats: GameStats | null;
  loading: boolean;
  playGame: (move: string, wager: number) => Promise<void>;
  revealGame: (gameId: string, move: string, salt: string) => Promise<void>;
  loadGameHistory: (page?: number, limit?: number) => Promise<void>;
  loadStats: () => Promise<void>;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const { user, updateTokens } = useAuth();
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [gameHistory, setGameHistory] = useState<Game[]>([]);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [loading, setLoading] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  };

  const playGame = useCallback(async (move: string, wager: number) => {
    if (!user) throw new Error('User not authenticated');

    console.log(`[GAME] Starting game for user ${user.username}: move=${move}, wager=${wager}`);
    setLoading(true);
    try {
      const response = await fetch('/api/games/play-house', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ move, wager }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.log(`[GAME] Failed to start game: ${error.message}`);
        throw new Error(error.message || 'Failed to start game');
      }

      const data = await response.json();
      console.log(`[GAME] Game started successfully: gameId=${data.gameId}`);

      // Set current game state
      setCurrentGame({
        gameId: data.gameId,
        gameType: 'ROCK_PAPER_SCISSORS',
        status: 'COMMITTED',
        wager,
        verified: false,
        createdAt: new Date().toISOString(),
      });

    } catch (error) {
      console.error('[GAME] Play game error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const revealGame = useCallback(async (gameId: string, move: string, salt: string) => {
    console.log(`[GAME] Revealing game ${gameId}: move=${move}`);
    setLoading(true);
    try {
      const response = await fetch(`/api/games/${gameId}/reveal`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ move, salt }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.log(`[GAME] Failed to reveal game: ${error.message}`);
        throw new Error(error.message || 'Failed to reveal game');
      }

      const data = await response.json();
      console.log(`[GAME] Game revealed successfully: playerWon=${data.result.playerWon}, payout=${data.result.payout}`);

      // Update current game with results
      const updatedGame: Game = {
        gameId,
        gameType: 'ROCK_PAPER_SCISSORS',
        status: 'COMPLETED',
        wager: data.settlement.wager,
        playerMove: data.result.playerMove,
        houseMove: data.result.houseMove,
        playerWon: data.result.playerWon,
        payout: data.result.payout,
        verified: data.result.verified,
        createdAt: currentGame?.createdAt || new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };

      setCurrentGame(updatedGame);

      // Update user token balance
      updateTokens(data.settlement.newBalance);
      console.log(`[GAME] Updated user balance to: ${data.settlement.newBalance}`);

      // Reload stats and history
      await Promise.all([loadStats(), loadGameHistory()]);

    } catch (error) {
      console.error('[GAME] Reveal game error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentGame, updateTokens]);

  const loadGameHistory = useCallback(async (page: number = 1, limit: number = 10) => {
    if (!user) return;

    console.log(`[GAME] Loading game history for user ${user.username}: page=${page}, limit=${limit}`);
    try {
      const response = await fetch(`/api/games?page=${page}&limit=${limit}`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`[GAME] Loaded ${data.games?.length || 0} games from history`);
        setGameHistory(data.games);
      } else {
        console.log(`[GAME] Failed to load game history: ${response.status}`);
      }
    } catch (error) {
      console.error('[GAME] Load game history error:', error);
    }
  }, [user]);

  const loadStats = useCallback(async () => {
    if (!user) return;

    console.log(`[GAME] Loading stats for user ${user.username}`);
    try {
      const response = await fetch('/api/games/stats/summary', {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`[GAME] Loaded stats: ${data.totalGamesPlayed} games played, balance: ${data.currentBalance}`);
        setStats(data);
      } else {
        console.log(`[GAME] Failed to load stats: ${response.status}`);
      }
    } catch (error) {
      console.error('[GAME] Load stats error:', error);
    }
  }, [user]);

  const resetGame = useCallback(() => {
    setCurrentGame(null);
  }, []);

  // Load data when user changes
  React.useEffect(() => {
    if (user) {
      loadStats();
      loadGameHistory();
    } else {
      setStats(null);
      setGameHistory([]);
      setCurrentGame(null);
    }
  }, [user, loadStats, loadGameHistory]);

  const value: GameContextType = {
    currentGame,
    gameHistory,
    stats,
    loading,
    playGame,
    revealGame,
    loadGameHistory,
    loadStats,
    resetGame,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};
