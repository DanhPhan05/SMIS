const authService = require('../services/authService');

exports.login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body.email, req.body.password);
    res.json({ message: 'Đăng nhập thành công', ...result });
  } catch (error) { next(error); }
};

exports.register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    res.status(201).json({ message: 'Tạo tài khoản thành công', user });
  } catch (error) { next(error); }
};

exports.getMe = async (req, res, next) => {
  try {
    const result = await authService.getProfile(req.user.id);
    res.json(result);
  } catch (error) { next(error); }
};
