import { DataTypes } from 'sequelize';

const defineTournamentParticipant = (sequelize) => {
  const TournamentParticipant = sequelize.define('TournamentParticipant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  tournamentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Tournaments',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  registeredAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  finalRank: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  prizeReceived: {
    type: DataTypes.DECIMAL(36, 18),
    defaultValue: 0,
  },
  });

  return TournamentParticipant;
};

export default defineTournamentParticipant;
