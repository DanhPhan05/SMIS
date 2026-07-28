const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email không hợp lệ',
    'any.required': 'Email là bắt buộc',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
    'any.required': 'Mật khẩu là bắt buộc',
  }),
});

const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email không hợp lệ',
    'any.required': 'Email là bắt buộc',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
    'any.required': 'Mật khẩu là bắt buộc',
  }),
  full_name: Joi.string().min(2).max(255).required().messages({
    'any.required': 'Họ tên là bắt buộc',
  }),
  role: Joi.string().valid('admin', 'teacher', 'student').required().messages({
    'any.only': 'Vai trò phải là admin, teacher hoặc student',
    'any.required': 'Vai trò là bắt buộc',
  }),
});

module.exports = { loginSchema, registerSchema };
