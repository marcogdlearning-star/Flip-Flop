import { DataTypes } from 'sequelize';

const defineGame = (sequelize) => {
  const Game = sequelize.define('Game', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  gameId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  gameType: {
    type: DataTypes.ENUM('ROCK_PAPER_SCISSORS'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'COMMITTED', 'REVEALED', 'VERIFIED', 'COMPLETED'),
    defaultValue: 'PENDING',
  },
  playerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  wager: {
    type: DataTypes.DECIMAL(36, 18),
    allowNull: false,
  },
  playerMove: {
    type: DataTypes.ENUM('ROCK', 'PAPER', 'SCISSORS'),
    allowNull: true,
  },
  houseMove: {
    type: DataTypes.ENUM('ROCK', 'PAPER', 'SCISSORS'),
    allowNull: true,
  },
  playerWon: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  payout: {
    type: DataTypes.DECIMAL(36, 18),
    defaultValue: 0,
  },
  commitmentHash: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  revealSalt: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  batchId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  gameIndexInBatch: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  });

  return Game;
};

export default defineGame;
