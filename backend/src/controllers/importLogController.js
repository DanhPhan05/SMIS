const { ImportLog, User } = require('../models');
const { parsePagination, paginatedResponse } = require('../utils/helpers');

exports.getAll = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { count, rows } = await ImportLog.findAndCountAll({
      limit, offset,
      order: [['created_at', 'DESC']],
      include: [{ model: User, as: 'importedByUser', attributes: ['id', 'full_name', 'email'] }],
    });
    res.json(paginatedResponse(rows, count, page, limit));
  } catch (error) { next(error); }
};
