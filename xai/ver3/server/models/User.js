import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';

const defineUser = (sequelize) => {
  const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  walletAddress: {
    type: DataTypes.STRING,
    unique: true,
  },
  tokens: {
    type: DataTypes.DECIMAL(36, 18), // Support decimal tokens
    defaultValue: 100, // free tokens
  },
  referrerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  isBanned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  lastGameTimestamp: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  totalGamesPlayed: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  gamesWon: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  totalWagered: {
    type: DataTypes.DECIMAL(36, 18),
    defaultValue: 0,
  },
  totalWon: {
    type: DataTypes.DECIMAL(36, 18),
    defaultValue: 0,
  },
  joinTimestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

User.beforeCreate(async (user) => {
  if (user.password) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});

User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

  return User;
};

export default defineUser;
