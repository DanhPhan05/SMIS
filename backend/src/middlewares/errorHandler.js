/* eslint-disable no-unused-vars */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({
      message: 'Dữ liệu không hợp lệ',
      errors,
    });
  }

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0]?.path || 'unknown';
    return res.status(409).json({
      message: `Dữ liệu đã tồn tại: ${field}`,
    });
  }

  // Sequelize foreign key constraint error
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      message: 'Không thể thực hiện do ràng buộc dữ liệu liên quan',
    });
  }

  // Joi validation error
  if (err.isJoi) {
    return res.status(400).json({
      message: 'Dữ liệu không hợp lệ',
      errors: err.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message,
      })),
    });
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      message: 'File quá lớn. Kích thước tối đa 10MB',
    });
  }

  // Custom application errors
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      message: err.message,
    });
  }

  // Default server error
  res.status(500).json({
    message: process.env.NODE_ENV === 'development'
      ? err.message
      : 'Đã xảy ra lỗi hệ thống',
  });
};

module.exports = errorHandler;
