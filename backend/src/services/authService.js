const jwt = require('jsonwebtoken');
const { User, Teacher, Student, Company } = require('../models');
const config = require('../config');
const { AppError } = require('../utils/helpers');

class AuthService {
  async login(email, password) {
    console.log('🔍 Login attempt:', { email });
    
    const user = await User.findOne({ where: { email } });
    console.log('👤 User found:', user ? `${user.email} (status: ${user.status})` : 'NOT FOUND');
    
    if (!user) {
      throw new AppError('Email hoặc mật khẩu không đúng', 401);
    }

    if (user.status !== 'active') {
      throw new AppError('Tài khoản đã bị vô hiệu hóa', 403);
    }

    const isValid = await user.validatePassword(password);
    console.log('🔐 Password validation:', isValid ? 'VALID' : 'INVALID');
    if (!isValid) {
      throw new AppError('Email hoặc mật khẩu không đúng', 401);
    }

    const token = this.generateToken(user);

    // Get profile info based on role
    let profile = null;
    if (user.role === 'teacher') {
      profile = await Teacher.findOne({
        where: { user_id: user.id },
        include: [{ model: Student, as: 'students', attributes: ['id', 'student_code', 'ho_ten_lot', 'ten'] }],
      });
    } else if (user.role === 'student') {
      profile = await Student.findOne({
        where: { user_id: user.id },
        include: [
          { model: Company, as: 'company', attributes: ['id', 'name'] },
          { model: Teacher, as: 'teacher', attributes: ['id', 'full_name'] },
        ],
      });
    }

    return { user: user.toJSON(), profile, token };
  }

  async register(userData) {
    const existing = await User.findOne({ where: { email: userData.email } });
    if (existing) {
      throw new AppError('Email đã được sử dụng', 409);
    }

    const user = await User.create(userData);
    return user.toJSON();
  }

  async getProfile(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('Không tìm thấy người dùng', 404);
    }

    let profile = null;
    if (user.role === 'teacher') {
      profile = await Teacher.findOne({
        where: { user_id: user.id },
        include: [{ model: Student, as: 'students', attributes: ['id', 'student_code', 'ho_ten_lot', 'ten', 'internship_status'] }],
      });
    } else if (user.role === 'student') {
      profile = await Student.findOne({
        where: { user_id: user.id },
        include: [
          { model: Company, as: 'company', attributes: ['id', 'name'] },
          { model: Teacher, as: 'teacher', attributes: ['id', 'full_name'] },
        ],
      });
    }

    return { user: user.toJSON(), profile };
  }

  generateToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }
}

module.exports = new AuthService();
