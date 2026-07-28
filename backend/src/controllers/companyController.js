const companyService = require('../services/companyService');
const importService = require('../services/importService');

exports.getAll = async (req, res, next) => {
  try {
    const result = await companyService.getAll(req.query);
    res.json(result);
  } catch (error) { next(error); }
};

exports.getById = async (req, res, next) => {
  try {
    const company = await companyService.getById(req.params.id);
    res.json(company);
  } catch (error) { next(error); }
};

exports.create = async (req, res, next) => {
  try {
    const company = await companyService.create(req.body);
    res.status(201).json({ message: 'Thêm doanh nghiệp thành công', company });
  } catch (error) { next(error); }
};

exports.update = async (req, res, next) => {
  try {
    const company = await companyService.update(req.params.id, req.body);
    res.json({ message: 'Cập nhật thành công', company });
  } catch (error) { next(error); }
};

exports.delete = async (req, res, next) => {
  try {
    const result = await companyService.delete(req.params.id);
    res.json(result);
  } catch (error) { next(error); }
};

exports.import = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Vui lòng chọn file' });
    const result = await importService.importFile(req.file.path, 'company', req.user.id);
    res.json({ message: 'Import hoàn tất', ...result });
  } catch (error) { next(error); }
};
