const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Recipient user ID',
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('supervision_request', 'request_approved', 'request_rejected', 'report_commented', 'general'),
    allowNull: false,
    defaultValue: 'general',
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  related_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID of related entity (e.g. supervision_request.id)',
  },
  related_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Type of related entity (e.g. supervision_request)',
  },
}, {
  tableName: 'notifications',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['is_read'] },
    { fields: ['user_id', 'is_read'] },
  ],
});

module.exports = Notification;
