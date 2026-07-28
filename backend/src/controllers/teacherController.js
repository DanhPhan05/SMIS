const teacherService = require('../services/teacherService');

exports.getNextCode = async (req, res, next) => {
  try {
    const code = await teacherService.getNextTeacherCode();
    res.json({ teacher_code: code });
  } catch (error) { next(error); }
};

exports.getAll = async (req, res, next) => {
  try {
    const result = await teacherService.getAll(req.query);
    res.json(result);
  } catch (error) { next(error); }
};

exports.getById = async (req, res, next) => {
  try {
    const teacher = await teacherService.getById(req.params.id);
    res.json(teacher);
  } catch (error) { next(error); }
};

exports.create = async (req, res, next) => {
  try {
    const teacher = await teacherService.create(req.body);
    res.status(201).json({ message: 'Thêm giảng viên thành công', teacher });
  } catch (error) { next(error); }
};

exports.update = async (req, res, next) => {
  try {
    const teacher = await teacherService.update(req.params.id, req.body);
    res.json({ message: 'Cập nhật thành công', teacher });
  } catch (error) { next(error); }
};

exports.delete = async (req, res, next) => {
  try {
    const result = await teacherService.delete(req.params.id);
    res.json(result);
  } catch (error) { next(error); }
};

exports.getPublicList = async (req, res, next) => {
  try {
    const teachers = await teacherService.getPublicList();
    res.json(teachers);
  } catch (error) { next(error); }
};

const importService = require('../services/importService');
exports.import = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Vui lòng chọn file' });
    const result = await importService.importFile(req.file.path, 'teacher', req.user.id);
    res.json({ message: 'Import hoàn tất', ...result });
  } catch (error) { next(error); }
};
