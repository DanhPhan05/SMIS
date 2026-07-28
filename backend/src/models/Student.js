const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    unique: true,
  },
  student_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  // ── Tách full_name → ho_ten_lot + ten (theo CSV mẫu GVHD) ──
  ho_ten_lot: {
    type: DataTypes.STRING(200),
    allowNull: false,
    defaultValue: '',
  },
  ten: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: '',
  },
  // Virtual getter để tương thích ngược với code cũ
  full_name: {
    type: DataTypes.VIRTUAL,
    get() {
      const lot = this.getDataValue('ho_ten_lot') || '';
      const t = this.getDataValue('ten') || '';
      return `${lot} ${t}`.trim();
    },
    set(value) {
      // Fallback: nếu set full_name, tự động tách
      if (value) {
        const parts = value.trim().split(/\s+/);
        if (parts.length > 1) {
          const ten = parts.pop();
          this.setDataValue('ho_ten_lot', parts.join(' '));
          this.setDataValue('ten', ten);
        } else {
          this.setDataValue('ho_ten_lot', '');
          this.setDataValue('ten', value.trim());
        }
      }
    },
  },
  class_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  major: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: { isEmail: true },
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  // ── SIMS 4.0 fields ──
  batch: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  academic_status: {
    type: DataTypes.ENUM('ACTIVE', 'GRADUATED', 'INACTIVE'),
    allowNull: false,
    defaultValue: 'ACTIVE',
  },
  internship_type: {
    type: DataTypes.ENUM('THUC_TAP', 'DO_AN'),
    allowNull: false,
    defaultValue: 'THUC_TAP',
  },
  // ── Thông tin Người tiếp nhận tại doanh nghiệp (per-student) ──
  nguoi_tiep_nhan: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  chuc_vu_nguoi_tiep_nhan: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  sdt_nguoi_tiep_nhan: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  email_nguoi_tiep_nhan: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  // ── Thông tin Người hướng dẫn tại doanh nghiệp (per-student) ──
  nguoi_huong_dan: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  chuc_vu_nguoi_huong_dan: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  sdt_nguoi_huong_dan: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  email_nguoi_huong_dan: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  // ─────────────────────────
  company_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  teacher_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  internship_status: {
    type: DataTypes.ENUM('not_started', 'in_progress', 'completed', 'suspended'),
    allowNull: false,
    defaultValue: 'not_started',
  },
}, {
  tableName: 'students',
  indexes: [
    { fields: ['batch'] },
    { fields: ['academic_status'] },
    { fields: ['internship_status'] },
    { fields: ['teacher_id'] },
    { fields: ['company_id'] },
  ],
});

module.exports = Student;
