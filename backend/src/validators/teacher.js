const Joi = require('joi');

const teacherSchema = Joi.object({
  teacher_code: Joi.string().max(50).optional().allow('', null),
  full_name: Joi.string().min(2).max(255).required().messages({
    'any.required': 'Họ tên là bắt buộc',
  }),
  email: Joi.string().email().allow('', null).messages({
    'string.email': 'Email không hợp lệ',
  }),
  department: Joi.string().max(255).allow('', null),
  phone: Joi.string().max(20).allow('', null),
});

module.exports = { teacherSchema };
