const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InternshipAssignment = sequelize.define('InternshipAssignment', {
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
  assigned_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  assigned_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  tableName: 'internship_assignments',
});

module.exports = InternshipAssignment;
