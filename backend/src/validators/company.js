const Joi = require('joi');

const companySchema = Joi.object({
  name: Joi.string().min(2).max(255).required().messages({
    'any.required': 'Tên doanh nghiệp là bắt buộc',
    'string.min': 'Tên doanh nghiệp phải có ít nhất 2 ký tự',
  }),
  address: Joi.string().allow('', null),
  email: Joi.string().email().allow('', null).messages({
    'string.email': 'Email không hợp lệ',
  }),
  phone: Joi.string().max(20).allow('', null),
  contact_person: Joi.string().max(255).allow('', null),
  notes: Joi.string().allow('', null),
});

module.exports = { companySchema };
