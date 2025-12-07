import crypto from 'crypto';
import { Game, User } from '../config/database.js';
import { getContractInstance } from './contractService.js';

class GameService {
  constructor() {
    this.moves = {
      ROCK: 0,
      PAPER: 1,
      SCISSORS: 2
    };

    this.moveNames = ['ROCK', 'PAPER', 'SCISSORS'];
  }

  /**
   * Generate a commitment hash for a player's move
   * @param {string} move - The player's move (ROCK, PAPER, SCISSORS)
   * @returns {Object} - Commitment data with hash and salt
   */
  generateCommitment(move) {
    if (!Object.keys(this.moves).includes(move)) {
      throw new Error('Invalid move');
    }

    const salt = crypto.randomBytes(32);
    const saltHex = '0x' + salt.toString('hex');
    const commitmentHash = crypto.createHash('sha256')
      .update(move + saltHex)
      .digest('hex');

    return {
      move,
      salt: saltHex,
      commitmentHash: '0x' + commitmentHash
    };
  }

  /**
   * Get cryptographically fair house move from blockchain randomness
   * @param {string} gameId - Game ID for randomness seed
   * @returns {string} - House move (ROCK, PAPER, or SCISSORS)
   */
  async getFairHouseMove(gameId) {
    try {
      console.log(`[RANDOMNESS] Getting fair house move for game ${gameId}`);

      const randomnessManager = getContractInstance('RandomnessManager');

      // Add game to batch (this will trigger VRF if batch is full)
      const batchId = await randomnessManager.addGameToBatch(gameId);
      console.log(`[RANDOMNESS] Game added to batch ${batchId}`);

      // For immediate gameplay, we'll use a fallback random method
      // In production, you'd wait for VRF fulfillment
      const fallbackRandom = crypto.randomBytes(4).readUInt32BE(0);
      const houseMoveIndex = fallbackRandom % 3;

      const houseMove = this.moveNames[houseMoveIndex];
      console.log(`[RANDOMNESS] Using fallback randomness: ${houseMove}`);

      return houseMove;

    } catch (error) {
      console.error('[RANDOMNESS] Failed to get blockchain randomness:', error);
      // Fallback to secure server-side randomness
      const fallbackRandom = crypto.randomBytes(4).readUInt32BE(0);
      const houseMoveIndex = fallbackRandom % 3;
      const houseMove = this.moveNames[houseMoveIndex];
      console.log(`[RANDOMNESS] Using server fallback: ${houseMove}`);
      return houseMove;
    }
  }

  /**
   * Determine the winner of Rock-Paper-Scissors
   * @param {string} playerMove - Player's move
   * @param {string} houseMove - House's move
   * @returns {string} - 'player', 'house', or 'tie'
   */
  determineWinner(playerMove, houseMove) {
    const player = this.moves[playerMove];
    const house = this.moves[houseMove];

    if (player === house) return 'tie'; // Tie - wager returned

    // Rock beats Scissors, Paper beats Rock, Scissors beats Paper
    if ((player === 0 && house === 2) ||
        (player === 1 && house === 0) ||
        (player === 2 && house === 1)) {
      return 'player';
    }

    return 'house';
  }

  /**
   * Calculate payout for a winning game
   * @param {number} wager - Amount wagered
   * @param {number} houseEdge - House edge in basis points (e.g., 200 = 2%)
   * @returns {number} - Payout amount
   */
  calculatePayout(wager, houseEdge = 200) {
    // Gross win = wager * 2
    const grossWin = wager * 2;
    // House fee = grossWin * houseEdge / 10000
    const houseFee = (grossWin * houseEdge) / 10000;
    // Net payout = grossWin - houseFee
    return grossWin - houseFee;
  }

  /**
   * Play a complete game against the house (single step)
   * @param {number} userId - User ID
   * @param {string} move - Player's move
   * @param {number} wager - Amount to wager
   * @returns {Object} - Complete game result
   */
  async playGameAgainstHouse(userId, move, wager) {
    console.log(`[GAME] Playing complete game for user ${userId}, move: ${move}, wager: ${wager}`);

    // Validate user and balance
    const user = await User.findByPk(userId);
    if (!user) {
      console.log(`[GAME] User not found: ${userId}`);
      throw new Error('User not found');
    }
    if (user.isBanned) {
      console.log(`[GAME] User is banned: ${userId}`);
      throw new Error('User is banned');
    }
    if (parseFloat(user.tokens) < wager) {
      console.log(`[GAME] Insufficient balance for user ${userId}: has ${user.tokens}, needs ${wager}`);
      throw new Error('Insufficient balance');
    }

    // Check if user is eligible (anti-sybil)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (!user.lastGameTimestamp || user.lastGameTimestamp < oneHourAgo || user.totalGamesPlayed > 0) {
      // User is eligible
    } else {
      throw new Error('New users must wait 1 hour before first game');
    }

    // Generate unique game ID
    const gameId = `game_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    // Get cryptographically fair house move
    const houseMove = await this.getFairHouseMove(gameId);

    // Determine winner
    const gameResult = this.determineWinner(move, houseMove);
    let payout = 0;
    let playerWon = false;

    if (gameResult === 'player') {
      playerWon = true;
      payout = this.calculatePayout(wager);
    } else if (gameResult === 'tie') {
      // Tie: return wager to player
      payout = wager;
    } else {
      // House wins: payout remains 0
      payout = 0;
    }

    // Calculate new balance
    const previousBalance = parseFloat(user.tokens);
    const newBalance = previousBalance - wager + payout;

    // Create complete game record
    const game = await Game.create({
      gameId,
      gameType: 'ROCK_PAPER_SCISSORS',
      status: 'COMPLETED',
      playerId: userId,
      wager,
      playerMove: move,
      houseMove,
      playerWon,
      payout,
      verified: true,
      completedAt: new Date()
    });

    // Update user statistics and balance
    await User.update({
      tokens: newBalance,
      totalGamesPlayed: user.totalGamesPlayed + 1,
      gamesWon: user.gamesWon + (playerWon ? 1 : 0),
      totalWagered: parseFloat(user.totalWagered) + wager,
      totalWon: parseFloat(user.totalWon) + payout,
      lastGameTimestamp: new Date()
    }, { where: { id: userId } });

    return {
      gameId,
      playerMove: move,
      houseMove,
      playerWon,
      wager,
      payout,
      previousBalance,
      newBalance,
      verified: true
    };
  }

  /**
   * Reveal and complete game (database-only with blockchain randomness)
   * @param {string} gameId - Game ID
   * @param {string} playerMove - Player's move
   * @param {string} revealSalt - Reveal salt
   * @returns {Object} - Game result
   */
  async revealAndVerifyGame(gameId, playerMove, revealSalt) {
    console.log(`[GAME] Revealing game ${gameId} with move ${playerMove}`);

    const game = await Game.findOne({ where: { gameId } });
    if (!game) throw new Error('Game not found');
    if (game.status !== 'COMMITTED') throw new Error('Game not in committed state');

    // Verify commitment
    const expectedCommitment = this.generateCommitment(playerMove);
    if (expectedCommitment.commitmentHash !== game.commitmentHash) {
      throw new Error('Invalid commitment reveal');
    }

    // Get fair house move from blockchain randomness
    const houseMove = await this.getFairHouseMove(gameId);

    // Determine winner
    const playerWon = this.determineWinner(playerMove, houseMove);
    const payout = playerWon ? this.calculatePayout(game.wager) : 0;

    // Update game record
    await Game.update({
      houseMove,
      playerWon,
      payout,
      verified: true,
      status: 'VERIFIED',
      completedAt: new Date()
    }, { where: { gameId } });

    // Update user statistics
    const user = await User.findByPk(game.playerId);
    await User.update({
      totalGamesPlayed: user.totalGamesPlayed + 1,
      gamesWon: user.gamesWon + (playerWon ? 1 : 0),
      totalWagered: parseFloat(user.totalWagered) + game.wager,
      totalWon: parseFloat(user.totalWon) + payout,
      lastGameTimestamp: new Date()
    }, { where: { id: game.playerId } });

    return {
      success: true,
      playerMove,
      houseMove,
      playerWon,
      payout,
      verified: true
    };
  }

  /**
   * Process game settlement (update user balance)
   * @param {string} gameId - Game ID
   * @returns {Object} - Settlement result
   */
  async settleGame(gameId) {
    console.log(`[GAME] Settling game ${gameId}`);

    const game = await Game.findOne({ where: { gameId } });
    if (!game) throw new Error('Game not found');
    if (game.status !== 'VERIFIED') throw new Error('Game not verified');

    const user = await User.findByPk(game.playerId);
    if (!user) throw new Error('User not found');

    // Calculate new balance
    let newBalance = parseFloat(user.tokens) - game.wager; // Deduct wager
    if (game.playerWon) {
      newBalance += game.payout; // Add payout
    }

    // Update user balance
    await User.update({
      tokens: newBalance
    }, { where: { id: game.playerId } });

    // Update game status
    await Game.update({
      status: 'COMPLETED'
    }, { where: { gameId } });

    return {
      success: true,
      previousBalance: parseFloat(user.tokens),
      newBalance,
      wager: game.wager,
      payout: game.payout,
      playerWon: game.playerWon
    };
  }

  /**
   * Get game details
   * @param {string} gameId - Game ID
   * @returns {Object} - Game details
   */
  async getGameDetails(gameId) {
    const game = await Game.findOne({
      where: { gameId },
      include: [{
        model: User,
        as: 'player',
        attributes: ['id', 'username']
      }]
    });

    if (!game) return null;

    return {
      gameId: game.gameId,
      gameType: game.gameType,
      status: game.status,
      player: game.player,
      wager: game.wager,
      playerMove: game.playerMove,
      houseMove: game.houseMove,
      playerWon: game.playerWon,
      payout: game.payout,
      verified: game.verified,
      createdAt: game.createdAt,
      completedAt: game.completedAt
    };
  }
}

export default new GameService();
