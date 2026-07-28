const { Op } = require('sequelize');
const { WeeklyReport, Student, Comment, Teacher } = require('../models');
const { AppError, parsePagination, paginatedResponse } = require('../utils/helpers');

class ReportService {
  async getAll(query, user) {
    const { page, limit, offset } = parsePagination(query);
    const { student_id, week_number, status } = query;

    const where = {};
    if (student_id) where.student_id = student_id;
    if (week_number) where.week_number = week_number;
    if (status) where.status = status;

    // If student, only show their reports
    if (user.role === 'student') {
      const student = await Student.findOne({ where: { user_id: user.id } });
      if (!student) throw new AppError('Không tìm thấy thông tin sinh viên', 404);
      where.student_id = student.id;
    }

    // If teacher, only show reports of their students
    if (user.role === 'teacher') {
      const teacher = await Teacher.findOne({ where: { user_id: user.id } });
      if (!teacher) throw new AppError('Không tìm thấy thông tin giảng viên', 404);
      const studentIds = await Student.findAll({
        where: { teacher_id: teacher.id },
        attributes: ['id'],
      });
      where.student_id = { [Op.in]: studentIds.map((s) => s.id) };
    }

    const { count, rows } = await WeeklyReport.findAndCountAll({
      where,
      limit,
      offset,
      order: [['week_number', 'DESC'], ['submitted_date', 'DESC']],
      include: [
        { model: Student, as: 'student', attributes: ['id', 'student_code', 'ho_ten_lot', 'ten'] },
        { model: Comment, as: 'comments', include: [{ model: Teacher, as: 'teacher', attributes: ['id', 'full_name'] }] },
      ],
    });

    return paginatedResponse(rows, count, page, limit);
  }

  async getById(id) {
    const report = await WeeklyReport.findByPk(id, {
      include: [
        { model: Student, as: 'student', attributes: ['id', 'student_code', 'ho_ten_lot', 'ten'] },
        {
          model: Comment,
          as: 'comments',
          include: [{ model: Teacher, as: 'teacher', attributes: ['id', 'full_name'] }],
        },
      ],
    });
    if (!report) {
      throw new AppError('Không tìm thấy báo cáo', 404);
    }
    return report;
  }

  async create(data, user) {
    const student = await Student.findOne({ where: { user_id: user.id } });
    if (!student) {
      throw new AppError('Không tìm thấy thông tin sinh viên', 404);
    }

    // Check duplicate week
    const existing = await WeeklyReport.findOne({
      where: { student_id: student.id, week_number: data.week_number },
    });
    if (existing) {
      throw new AppError(`Báo cáo tuần ${data.week_number} đã tồn tại`, 409);
    }

    return WeeklyReport.create({
      ...data,
      student_id: student.id,
      submitted_date: new Date(),
      status: 'submitted',
    });
  }

  async update(id, data, user) {
    const report = await WeeklyReport.findByPk(id);
    if (!report) {
      throw new AppError('Không tìm thấy báo cáo', 404);
    }

    // Check ownership
    const student = await Student.findOne({ where: { user_id: user.id } });
    if (!student || report.student_id !== student.id) {
      throw new AppError('Bạn không có quyền sửa báo cáo này', 403);
    }

    // Only allow update if status is submitted or needs_revision
    if (!['submitted', 'needs_revision'].includes(report.status)) {
      throw new AppError('Không thể sửa báo cáo đã được duyệt', 400);
    }

    return report.update(data);
  }

  async updateStatus(id, status, user) {
    const report = await WeeklyReport.findByPk(id);
    if (!report) {
      throw new AppError('Không tìm thấy báo cáo', 404);
    }

    // Verify teacher has access
    const teacher = await Teacher.findOne({ where: { user_id: user.id } });
    if (!teacher) {
      throw new AppError('Không tìm thấy thông tin giảng viên', 404);
    }

    const student = await Student.findByPk(report.student_id);
    if (!student || student.teacher_id !== teacher.id) {
      throw new AppError('Bạn không có quyền cập nhật báo cáo này', 403);
    }

    return report.update({ status });
  }
}

module.exports = new ReportService();
