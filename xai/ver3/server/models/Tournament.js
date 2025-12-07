import { DataTypes } from 'sequelize';

const defineTournament = (sequelize) => {
  const Tournament = sequelize.define('Tournament', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  tournamentId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  entryFee: {
    type: DataTypes.DECIMAL(36, 18),
    allowNull: false,
  },
  maxParticipants: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  currentParticipants: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  prizePool: {
    type: DataTypes.DECIMAL(36, 18),
    defaultValue: 0,
  },
  houseContribution: {
    type: DataTypes.DECIMAL(36, 18),
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM('REGISTRATION', 'ACTIVE', 'COMPLETED', 'CANCELLED'),
    defaultValue: 'REGISTRATION',
  },
  registrationDeadline: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  prizeDistribution: {
    type: DataTypes.JSON, // Array of prize percentages
    allowNull: false,
  },
  finalists: {
    type: DataTypes.JSON, // Array of finalist addresses
    allowNull: true,
  },
  prizesDistributed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  });

  return Tournament;
};

export default defineTournament;
