const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Score = sequelize.define('Score', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  teacher_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  score_type: {
    type: DataTypes.ENUM('TEACHER', 'COMPANY'),
    allowNull: false,
    defaultValue: 'TEACHER',
  },
  attendance_score: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
    validate: { min: 0, max: 10 },
  },
  professional_score: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
    validate: { min: 0, max: 10 },
  },
  average_score: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
    validate: { min: 0, max: 10 },
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'scores',
  indexes: [
    {
      unique: true,
      fields: ['student_id', 'score_type'],
      name: 'unique_student_score_type',
    },
  ],
});

module.exports = Score;
