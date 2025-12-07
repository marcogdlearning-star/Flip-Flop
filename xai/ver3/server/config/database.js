import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import defineUser from '../models/User.js';
import defineGame from '../models/Game.js';
import defineTournament from '../models/Tournament.js';
import defineTournamentParticipant from '../models/TournamentParticipant.js';

dotenv.config();

// Database configuration
const sequelize = new Sequelize({
  dialect: process.env.DB_DIALECT || 'sqlite',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'flipflop',
  username: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
  storage: process.env.DB_STORAGE || './database.sqlite', // For SQLite
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Define models
const User = defineUser(sequelize);
const Game = defineGame(sequelize);
const Tournament = defineTournament(sequelize);
const TournamentParticipant = defineTournamentParticipant(sequelize);

// Define model associations
const defineAssociations = () => {
  // User associations
  User.hasMany(Game, { foreignKey: 'playerId', as: 'games' });
  User.hasMany(TournamentParticipant, { foreignKey: 'userId', as: 'tournamentParticipations' });
  User.belongsTo(User, { foreignKey: 'referrerId', as: 'referrer' });
  User.hasMany(User, { foreignKey: 'referrerId', as: 'referrals' });

  // Game associations
  Game.belongsTo(User, { foreignKey: 'playerId', as: 'player' });

  // Tournament associations
  Tournament.hasMany(TournamentParticipant, { foreignKey: 'tournamentId', as: 'participants' });

  // TournamentParticipant associations
  TournamentParticipant.belongsTo(Tournament, { foreignKey: 'tournamentId', as: 'tournament' });
  TournamentParticipant.belongsTo(User, { foreignKey: 'userId', as: 'user' });
};

// Initialize associations
defineAssociations();

export { User, Game, Tournament, TournamentParticipant };
export default sequelize;
