const studentService = require('../services/studentService');
const importService = require('../services/importService');
const { Teacher } = require('../models');

exports.getNextCode = async (req, res, next) => {
  try {
    const code = await studentService.getNextStudentCode();
    res.json({ student_code: code });
  } catch (error) { next(error); }
};

exports.getAll = async (req, res, next) => {
  try {
    const query = { ...req.query };
    if (req.user && req.user.role === 'teacher') {
      const teacher = await Teacher.findOne({ where: { user_id: req.user.id } });
      if (teacher) {
        query.teacher_id = teacher.id;
      } else {
        return res.json({ data: [], pagination: { total: 0, page: 1, limit: 10 } });
      }
    }
    const result = await studentService.getAll(query);
    res.json(result);
  } catch (error) { next(error); }
};

exports.getById = async (req, res, next) => {
  try {
    const student = await studentService.getById(req.params.id);
    res.json(student);
  } catch (error) { next(error); }
};

exports.create = async (req, res, next) => {
  try {
    const student = await studentService.create(req.body);
    res.status(201).json({ message: 'Thêm sinh viên thành công', student });
  } catch (error) { next(error); }
};

exports.update = async (req, res, next) => {
  try {
    const student = await studentService.update(req.params.id, req.body);
    res.json({ message: 'Cập nhật thành công', student });
  } catch (error) { next(error); }
};

exports.delete = async (req, res, next) => {
  try {
    const result = await studentService.delete(req.params.id);
    res.json(result);
  } catch (error) { next(error); }
};

exports.deleteMany = async (req, res, next) => {
  try {
    const { ids } = req.body;
    const result = await studentService.deleteMany(ids);
    res.json(result);
  } catch (error) { next(error); }
};

exports.import = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Vui lòng chọn file' });
    const result = await importService.importFile(req.file.path, 'student', req.user.id);
    res.json({ message: 'Import hoàn tất', ...result });
  } catch (error) { next(error); }
};

exports.getBatches = async (req, res, next) => {
  try {
    const batches = await studentService.getBatches();
    res.json(batches);
  } catch (error) { next(error); }
};
