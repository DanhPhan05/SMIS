const reportService = require('../services/reportService');

exports.getAll = async (req, res, next) => {
  try {
    const result = await reportService.getAll(req.query, req.user);
    res.json(result);
  } catch (error) { next(error); }
};

exports.getById = async (req, res, next) => {
  try {
    const report = await reportService.getById(req.params.id);
    res.json(report);
  } catch (error) { next(error); }
};

exports.create = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.file) data.file_path = `uploads/reports/${req.file.filename}`;
    const report = await reportService.create(data, req.user);
    res.status(201).json({ message: 'Nộp báo cáo thành công', report });
  } catch (error) { next(error); }
};

exports.update = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.file) data.file_path = `uploads/reports/${req.file.filename}`;
    const report = await reportService.update(req.params.id, data, req.user);
    res.json({ message: 'Cập nhật báo cáo thành công', report });
  } catch (error) { next(error); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const report = await reportService.updateStatus(req.params.id, req.body.status, req.user);
    res.json({ message: 'Cập nhật trạng thái thành công', report });
  } catch (error) { next(error); }
};
