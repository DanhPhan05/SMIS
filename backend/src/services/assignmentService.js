const { InternshipAssignment, Student, Teacher, User } = require('../models');
const { AppError, parsePagination, paginatedResponse } = require('../utils/helpers');

class AssignmentService {
  async getAll(query) {
    const { page, limit, offset } = parsePagination(query);

    const { count, rows } = await InternshipAssignment.findAndCountAll({
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        { model: Student, as: 'student', attributes: ['id', 'student_code', 'ho_ten_lot', 'ten'] },
        { model: Teacher, as: 'teacher', attributes: ['id', 'teacher_code', 'full_name'] },
        { model: User, as: 'assignedByUser', attributes: ['id', 'full_name'] },
      ],
    });

    return paginatedResponse(rows, count, page, limit);
  }

  async create(data, userId) {
    const student = await Student.findByPk(data.student_id);
    if (!student) {
      throw new AppError('Không tìm thấy sinh viên', 404);
    }

    const teacher = await Teacher.findByPk(data.teacher_id);
    if (!teacher) {
      throw new AppError('Không tìm thấy giảng viên', 404);
    }

    // Deactivate previous assignment
    await InternshipAssignment.update(
      { is_active: false },
      { where: { student_id: data.student_id, is_active: true } }
    );

    // Update student's current teacher
    await student.update({ teacher_id: data.teacher_id });

    // Create new assignment record
    return InternshipAssignment.create({
      ...data,
      assigned_by: userId,
      assigned_date: new Date(),
      is_active: true,
    });
  }

  async update(id, data, userId) {
    const assignment = await InternshipAssignment.findByPk(id);
    if (!assignment) {
      throw new AppError('Không tìm thấy phân công', 404);
    }

    if (data.teacher_id) {
      const teacher = await Teacher.findByPk(data.teacher_id);
      if (!teacher) {
        throw new AppError('Không tìm thấy giảng viên', 404);
      }

      // Update student's current teacher
      await Student.update(
        { teacher_id: data.teacher_id },
        { where: { id: assignment.student_id } }
      );
    }

    return assignment.update(data);
  }

  async getHistory(studentId) {
    const assignments = await InternshipAssignment.findAll({
      where: { student_id: studentId },
      order: [['created_at', 'DESC']],
      include: [
        { model: Teacher, as: 'teacher', attributes: ['id', 'teacher_code', 'full_name'] },
        { model: User, as: 'assignedByUser', attributes: ['id', 'full_name'] },
      ],
    });

    return assignments;
  }
}

module.exports = new AssignmentService();
