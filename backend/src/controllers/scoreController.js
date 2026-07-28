const scoreService = require('../services/scoreService');

exports.create = async (req, res, next) => {
  try {
    const score = await scoreService.create(req.body, req.user);
    res.status(201).json({ message: 'Chấm điểm thành công', score });
  } catch (error) { next(error); }
};

exports.update = async (req, res, next) => {
  try {
    const score = await scoreService.update(req.params.id, req.body, req.user);
    res.json({ message: 'Cập nhật điểm thành công', score });
  } catch (error) { next(error); }
};

exports.getByStudentId = async (req, res, next) => {
  try {
    const scores = await scoreService.getByStudentId(req.params.studentId);
    res.json(scores);
  } catch (error) { next(error); }
};

exports.getFinalScore = async (req, res, next) => {
  try {
    const result = await scoreService.getFinalScore(req.params.studentId);
    res.json(result);
  } catch (error) { next(error); }
};
