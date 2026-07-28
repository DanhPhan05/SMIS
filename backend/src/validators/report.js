const Joi = require('joi');

const reportSchema = Joi.object({
  week_number: Joi.number().integer().min(1).max(52).required().messages({
    'any.required': 'Số tuần là bắt buộc',
    'number.min': 'Tuần phải từ 1',
    'number.max': 'Tuần tối đa là 52',
  }),
  content: Joi.string().min(10).required().messages({
    'any.required': 'Nội dung báo cáo là bắt buộc',
    'string.min': 'Nội dung phải có ít nhất 10 ký tự',
  }),
});

const reportUpdateSchema = Joi.object({
  content: Joi.string().min(10).messages({
    'string.min': 'Nội dung phải có ít nhất 10 ký tự',
  }),
});

const reportStatusSchema = Joi.object({
  status: Joi.string()
    .valid('submitted', 'viewed', 'needs_revision', 'approved')
    .required()
    .messages({
      'any.required': 'Trạng thái là bắt buộc',
      'any.only': 'Trạng thái không hợp lệ',
    }),
});

module.exports = { reportSchema, reportUpdateSchema, reportStatusSchema };
