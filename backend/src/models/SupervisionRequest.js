const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * SupervisionRequest — student-initiated request for a teacher to supervise their internship.
 * Workflow: Student submits PENDING → Teacher APPROVES or REJECTS
 * On APPROVE: student.teacher_id is updated automatically (in service layer)
 */
const SupervisionRequest = sequelize.define('SupervisionRequest', {
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
  message: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Optional message from student to teacher',
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
    allowNull: false,
    defaultValue: 'PENDING',
  },
  request_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  response_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  response_note: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Teacher note on approval or rejection',
  },
}, {
  tableName: 'supervision_requests',
  indexes: [
    { fields: ['student_id'] },
    { fields: ['teacher_id'] },
    { fields: ['status'] },
  ],
});

module.exports = SupervisionRequest;
