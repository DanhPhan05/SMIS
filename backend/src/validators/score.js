const Joi = require('joi');

const scoreSchema = Joi.object({
  student_id: Joi.number().integer().required().messages({
    'any.required': 'Mã sinh viên là bắt buộc',
  }),
  score_type: Joi.string().valid('TEACHER', 'COMPANY').default('TEACHER').messages({
    'any.only': 'Loại điểm phải là TEACHER hoặc COMPANY',
  }),
  attendance_score: Joi.number().min(0).max(10).precision(2).allow(null),
  professional_score: Joi.number().min(0).max(10).precision(2).allow(null),
  notes: Joi.string().allow('', null),
});

const scoreUpdateSchema = Joi.object({
  attendance_score: Joi.number().min(0).max(10).precision(2).allow(null),
  professional_score: Joi.number().min(0).max(10).precision(2).allow(null),
  notes: Joi.string().allow('', null),
});

const commentSchema = Joi.object({
  report_id: Joi.number().integer().required().messages({
    'any.required': 'Mã báo cáo là bắt buộc',
  }),
  content: Joi.string().min(1).required().messages({
    'any.required': 'Nội dung nhận xét là bắt buộc',
  }),
});

module.exports = { scoreSchema, scoreUpdateSchema, commentSchema };
