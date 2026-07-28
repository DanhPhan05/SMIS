const Joi = require('joi');

const studentSchema = Joi.object({
  student_code: Joi.string().max(50).optional().allow('', null),
  full_name: Joi.string().min(2).max(255).required().messages({
    'any.required': 'Họ tên là bắt buộc',
  }),
  class_name: Joi.string().max(100).allow('', null),
  major: Joi.string().max(255).allow('', null),
  batch: Joi.string().max(20).allow('', null),
  email: Joi.string().email().allow('', null).messages({
    'string.email': 'Email không hợp lệ',
  }),
  phone: Joi.string().max(20).allow('', null),
  company_id: Joi.number().integer().allow(null),
  teacher_id: Joi.number().integer().allow(null),
  academic_status: Joi.string().valid('ACTIVE', 'GRADUATED', 'INACTIVE').default('ACTIVE'),
  internship_status: Joi.string()
    .valid('not_started', 'in_progress', 'completed', 'suspended')
    .default('not_started'),
});

const studentUpdateSchema = Joi.object({
  student_code: Joi.string().max(50).allow('', null),
  full_name: Joi.string().min(2).max(255),
  class_name: Joi.string().max(100).allow('', null),
  major: Joi.string().max(255).allow('', null),
  batch: Joi.string().max(20).allow('', null),
  email: Joi.string().email().allow('', null),
  phone: Joi.string().max(20).allow('', null),
  company_id: Joi.number().integer().allow(null),
  teacher_id: Joi.number().integer().allow(null),
  academic_status: Joi.string().valid('ACTIVE', 'GRADUATED', 'INACTIVE'),
  internship_status: Joi.string()
    .valid('not_started', 'in_progress', 'completed', 'suspended'),
});

module.exports = { studentSchema, studentUpdateSchema };
