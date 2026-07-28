const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  address: {
    type: DataTypes.TEXT,
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
  // ── Thông tin Người tiếp nhận (mức công ty - mặc định) ──
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
  // ── Thông tin Người hướng dẫn tại doanh nghiệp (mức công ty - mặc định) ──
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
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'companies',
});

module.exports = Company;
