const { Op } = require('sequelize');
const { Company, Student } = require('../models');
const { AppError, parsePagination, paginatedResponse } = require('../utils/helpers');

class CompanyService {
  async getAll(query) {
    const { page, limit, offset } = parsePagination(query);
    const { search } = query;

    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { address: { [Op.iLike]: `%${search}%` } },
        { nguoi_tiep_nhan: { [Op.iLike]: `%${search}%` } },
        { nguoi_huong_dan: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Company.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [{ model: Student, as: 'students', attributes: ['id', 'student_code', 'ho_ten_lot', 'ten'] }],
    });

    return paginatedResponse(rows, count, page, limit);
  }

  async getById(id) {
    const company = await Company.findByPk(id, {
      include: [{ model: Student, as: 'students', attributes: ['id', 'student_code', 'ho_ten_lot', 'ten', 'internship_status'] }],
    });
    if (!company) {
      throw new AppError('Không tìm thấy doanh nghiệp', 404);
    }
    return company;
  }

  async create(data) {
    return Company.create(data);
  }

  async update(id, data) {
    const company = await Company.findByPk(id);
    if (!company) {
      throw new AppError('Không tìm thấy doanh nghiệp', 404);
    }
    return company.update(data);
  }

  async delete(id) {
    const company = await Company.findByPk(id);
    if (!company) {
      throw new AppError('Không tìm thấy doanh nghiệp', 404);
    }

    const studentCount = await Student.count({ where: { company_id: id } });
    if (studentCount > 0) {
      throw new AppError('Không thể xóa doanh nghiệp đang có sinh viên thực tập', 400);
    }

    await company.destroy();
    return { message: 'Đã xóa doanh nghiệp thành công' };
  }
}

module.exports = new CompanyService();
