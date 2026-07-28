const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ImportLog = sequelize.define('ImportLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  imported_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  import_type: {
    type: DataTypes.ENUM('company', 'student', 'teacher'),
    allowNull: false,
  },
  file_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  total_rows: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  success_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  error_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  error_details: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const raw = this.getDataValue('error_details');
      if (!raw) return null;
      try { return JSON.parse(raw); } catch { return raw; }
    },
    set(value) {
      this.setDataValue('error_details', value ? JSON.stringify(value) : null);
    },
  },
}, {
  tableName: 'import_logs',
});

module.exports = ImportLog;
