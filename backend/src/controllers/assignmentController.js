const assignmentService = require('../services/assignmentService');

exports.getAll = async (req, res, next) => {
  try {
    const result = await assignmentService.getAll(req.query);
    res.json(result);
  } catch (error) { next(error); }
};

exports.create = async (req, res, next) => {
  try {
    const assignment = await assignmentService.create(req.body, req.user.id);
    res.status(201).json({ message: 'Phân công thành công', assignment });
  } catch (error) { next(error); }
};

exports.update = async (req, res, next) => {
  try {
    const assignment = await assignmentService.update(req.params.id, req.body, req.user.id);
    res.json({ message: 'Cập nhật phân công thành công', assignment });
  } catch (error) { next(error); }
};

exports.getHistory = async (req, res, next) => {
  try {
    const history = await assignmentService.getHistory(req.params.studentId);
    res.json(history);
  } catch (error) { next(error); }
};
