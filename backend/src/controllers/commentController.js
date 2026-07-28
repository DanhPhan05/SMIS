const commentService = require('../services/commentService');

exports.create = async (req, res, next) => {
  try {
    const comment = await commentService.create(req.body, req.user);
    res.status(201).json({ message: 'Thêm nhận xét thành công', comment });
  } catch (error) { next(error); }
};

exports.getByReportId = async (req, res, next) => {
  try {
    const comments = await commentService.getByReportId(req.params.reportId);
    res.json(comments);
  } catch (error) { next(error); }
};
