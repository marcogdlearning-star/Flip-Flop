import express from 'express';
import jwt from 'jsonwebtoken';
import { ethers } from 'ethers';
import gameService from '../services/gameService.js';
import { Game, User } from '../config/database.js';
import { Op } from 'sequelize';

const router = express.Router();

// Middleware to authenticate user
const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Access denied' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid token' });
  }
};

/**
 * GET /api/games
 * Get user's game history
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: games } = await Game.findAndCountAll({
      where: { playerId: req.user.id },
      include: [{
        model: User,
        as: 'player',
        attributes: ['id', 'username']
      }],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      games,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalGames: count,
        hasNext: page * limit < count,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get games error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/games/:gameId
 * Get specific game details
 */
router.get('/:gameId', authenticate, async (req, res) => {
  try {
    const gameDetails = await gameService.getGameDetails(req.params.gameId);

    if (!gameDetails) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // Only allow players to view their own games
    if (gameDetails.player.id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(gameDetails);
  } catch (error) {
    console.error('Get game details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/games/play-house
 * Play a complete game against the house (single step)
 */
router.post('/play-house', authenticate, async (req, res) => {
  try {
    const { move, wager } = req.body;

    // Validate input
    if (!move || !['ROCK', 'PAPER', 'SCISSORS'].includes(move)) {
      return res.status(400).json({ message: 'Invalid move. Must be ROCK, PAPER, or SCISSORS' });
    }

    if (!wager || wager <= 0) {
      return res.status(400).json({ message: 'Invalid wager amount' });
    }

    // Play complete game in single step
    const result = await gameService.playGameAgainstHouse(req.user.id, move, wager);

    // Determine game outcome
    let outcome = 'loss';
    if (result.playerWon) {
      outcome = 'win';
    } else if (result.payout === result.wager) {
      outcome = 'tie';
    }

    res.json({
      gameId: result.gameId,
      result: {
        playerMove: result.playerMove,
        houseMove: result.houseMove,
        outcome: outcome,
        payout: result.payout,
        wager: result.wager
      },
      settlement: {
        previousBalance: result.previousBalance,
        newBalance: result.newBalance
      },
      verified: result.verified
    });

  } catch (error) {
    console.error('Play house error:', error);

    if (error.message.includes('Insufficient balance') ||
        error.message.includes('User not eligible') ||
        error.message.includes('Invalid move')) {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/games/:gameId/reveal
 * Reveal and complete a game
 */
router.post('/:gameId/reveal', authenticate, async (req, res) => {
  try {
    const { move, salt } = req.body;
    const gameId = req.params.gameId;

    // Validate input
    if (!move || !['ROCK', 'PAPER', 'SCISSORS'].includes(move)) {
      return res.status(400).json({ message: 'Invalid move' });
    }

    if (!salt) {
      return res.status(400).json({ message: 'Salt is required' });
    }

    // Check if game belongs to user
    const game = await Game.findOne({ where: { gameId, playerId: req.user.id } });
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    if (game.status !== 'COMMITTED') {
      return res.status(400).json({ message: 'Game not in committed state' });
    }

    // Reveal and verify the game
    const result = await gameService.revealAndVerifyGame(gameId, move, salt);

    if (!result.success) {
      return res.status(500).json({
        message: 'Failed to verify game',
        error: result.error
      });
    }

    // Settle the game (update user balance)
    const settlement = await gameService.settleGame(gameId);

    res.json({
      gameId,
      result: {
        playerMove: result.playerMove,
        houseMove: result.houseMove,
        playerWon: result.playerWon,
        payout: result.payout,
        verified: result.verified
      },
      settlement: {
        previousBalance: settlement.previousBalance,
        newBalance: settlement.newBalance,
        wager: settlement.wager,
        payout: settlement.payout
      }
    });

  } catch (error) {
    console.error('Reveal game error:', error);

    if (error.message.includes('Game not found') ||
        error.message.includes('not in committed state')) {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/games/stats/summary
 * Get user's gaming statistics
 */
router.get('/stats/summary', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: [
        'totalGamesPlayed',
        'gamesWon',
        'totalWagered',
        'totalWon',
        'tokens'
      ]
    });

    const gamesLost = user.totalGamesPlayed - user.gamesWon;
    const winRate = user.totalGamesPlayed > 0
      ? (user.gamesWon / user.totalGamesPlayed * 100).toFixed(2)
      : 0;

    const profitLoss = parseFloat(user.totalWon) - parseFloat(user.totalWagered);

    res.json({
      totalGamesPlayed: user.totalGamesPlayed,
      gamesWon: user.gamesWon,
      gamesLost,
      winRate: parseFloat(winRate),
      totalWagered: parseFloat(user.totalWagered),
      totalWon: parseFloat(user.totalWon),
      profitLoss,
      currentBalance: parseFloat(user.tokens)
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/games/leaderboard
 * Get global leaderboard
 */
router.get('/leaderboard/global', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const leaderboard = await User.findAll({
      where: { totalGamesPlayed: { [Op.gt]: 0 } },
      attributes: [
        'id',
        'username',
        'totalGamesPlayed',
        'gamesWon',
        'totalWon',
        'totalWagered'
      ],
      order: [['totalWon', 'DESC']],
      limit
    });

    // Calculate win rates
    const leaderboardWithStats = leaderboard.map(user => ({
      id: user.id,
      username: user.username,
      totalGamesPlayed: user.totalGamesPlayed,
      gamesWon: user.gamesWon,
      totalWon: parseFloat(user.totalWon),
      totalWagered: parseFloat(user.totalWagered),
      winRate: user.totalGamesPlayed > 0
        ? (user.gamesWon / user.totalGamesPlayed * 100).toFixed(2)
        : 0,
      profitLoss: parseFloat(user.totalWon) - parseFloat(user.totalWagered)
    }));

    res.json({ leaderboard: leaderboardWithStats });

  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
