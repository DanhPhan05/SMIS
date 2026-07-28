const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WeeklyReport = sequelize.define('WeeklyReport', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  week_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 52 },
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  submitted_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  file_path: {
    type: DataTypes.STRING(500),
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('file_path');
      if (!rawValue) return null;
      const normalized = rawValue.replace(/\\/g, '/');
      const index = normalized.indexOf('uploads/reports/');
      if (index !== -1) {
        return normalized.substring(index);
      }
      return normalized;
    }
  },
  status: {
    type: DataTypes.ENUM('submitted', 'viewed', 'needs_revision', 'approved'),
    allowNull: false,
    defaultValue: 'submitted',
  },
}, {
  tableName: 'weekly_reports',
});

module.exports = WeeklyReport;
