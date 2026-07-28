const sequelize = require('../config/database');
const User = require('./User');
const Company = require('./Company');
const Teacher = require('./Teacher');
const Student = require('./Student');
const InternshipAssignment = require('./InternshipAssignment');
const WeeklyReport = require('./WeeklyReport');
const Comment = require('./Comment');
const Score = require('./Score');
const ImportLog = require('./ImportLog');
const SupervisionRequest = require('./SupervisionRequest');
const Notification = require('./Notification');

// ===== Associations =====

// User <-> Teacher (1:1)
User.hasOne(Teacher, { foreignKey: 'user_id', as: 'teacherProfile' });
Teacher.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User <-> Student (1:1)
User.hasOne(Student, { foreignKey: 'user_id', as: 'studentProfile' });
Student.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Company <-> Student (1:N)
Company.hasMany(Student, { foreignKey: 'company_id', as: 'students' });
Student.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

// Teacher <-> Student (1:N) - current assignment
Teacher.hasMany(Student, { foreignKey: 'teacher_id', as: 'students' });
Student.belongsTo(Teacher, { foreignKey: 'teacher_id', as: 'teacher' });

// InternshipAssignment associations
Student.hasMany(InternshipAssignment, { foreignKey: 'student_id', as: 'assignments' });
InternshipAssignment.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

Teacher.hasMany(InternshipAssignment, { foreignKey: 'teacher_id', as: 'assignments' });
InternshipAssignment.belongsTo(Teacher, { foreignKey: 'teacher_id', as: 'teacher' });

User.hasMany(InternshipAssignment, { foreignKey: 'assigned_by', as: 'madeAssignments' });
InternshipAssignment.belongsTo(User, { foreignKey: 'assigned_by', as: 'assignedByUser' });

// WeeklyReport associations
Student.hasMany(WeeklyReport, { foreignKey: 'student_id', as: 'reports' });
WeeklyReport.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

// Comment associations
WeeklyReport.hasMany(Comment, { foreignKey: 'report_id', as: 'comments' });
Comment.belongsTo(WeeklyReport, { foreignKey: 'report_id', as: 'report' });

Teacher.hasMany(Comment, { foreignKey: 'teacher_id', as: 'comments' });
Comment.belongsTo(Teacher, { foreignKey: 'teacher_id', as: 'teacher' });

// Score associations
Student.hasMany(Score, { foreignKey: 'student_id', as: 'scores' });
Score.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

Teacher.hasMany(Score, { foreignKey: 'teacher_id', as: 'gradedScores' });
Score.belongsTo(Teacher, { foreignKey: 'teacher_id', as: 'teacher' });

// ImportLog associations
User.hasMany(ImportLog, { foreignKey: 'imported_by', as: 'importLogs' });
ImportLog.belongsTo(User, { foreignKey: 'imported_by', as: 'importedByUser' });

// ── SIMS 4.0: SupervisionRequest associations ──
Student.hasMany(SupervisionRequest, { foreignKey: 'student_id', as: 'supervisionRequests' });
SupervisionRequest.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

Teacher.hasMany(SupervisionRequest, { foreignKey: 'teacher_id', as: 'supervisionRequests' });
SupervisionRequest.belongsTo(Teacher, { foreignKey: 'teacher_id', as: 'teacher' });

// ── SIMS 4.0: Notification associations ──
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize,
  User,
  Company,
  Teacher,
  Student,
  InternshipAssignment,
  WeeklyReport,
  Comment,
  Score,
  ImportLog,
  SupervisionRequest,
  Notification,
};
