const { Op, fn, col } = require('sequelize');
const { Teacher, Student, User } = require('../models');
const { AppError, parsePagination, paginatedResponse } = require('../utils/helpers');

class TeacherService {
  async getNextTeacherCode() {
    const teachers = await Teacher.findAll({ attributes: ['teacher_code'] });
    let maxNum = 0;
    for (const t of teachers) {
      if (t.teacher_code && t.teacher_code.toUpperCase().startsWith('GV')) {
        const num = parseInt(t.teacher_code.substring(2), 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    }
    return `GV${String(maxNum + 1).padStart(3, '0')}`;
  }
  async getAll(query) {
    const { page, limit, offset } = parsePagination(query);
    const { search } = query;

    const where = {};
    if (search) {
      where[Op.or] = [
        { teacher_code: { [Op.iLike]: `%${search}%` } },
        { full_name: { [Op.iLike]: `%${search}%` } },
        { department: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Teacher.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        { model: Student, as: 'students', attributes: ['id', 'student_code', 'ho_ten_lot', 'ten'] },
      ],
    });

    return paginatedResponse(rows, count, page, limit);
  }

  async getById(id) {
    const teacher = await Teacher.findByPk(id, {
      include: [
        { model: Student, as: 'students', attributes: ['id', 'student_code', 'ho_ten_lot', 'ten', 'internship_status'] },
        { model: User, as: 'user', attributes: ['id', 'email', 'status'] },
      ],
    });
    if (!teacher) {
      throw new AppError('Không tìm thấy giảng viên', 404);
    }
    return teacher;
  }

  async create(data) {
    // Auto-generate teacher_code if not provided
    if (!data.teacher_code) {
      data.teacher_code = await this.getNextTeacherCode();
    }

    const existing = await Teacher.findOne({ where: { teacher_code: data.teacher_code } });
    if (existing) {
      throw new AppError('Mã giảng viên đã tồn tại', 409);
    }

    let userId = null;
    if (data.email) {
      const existingUser = await User.findOne({ where: { email: data.email } });
      if (!existingUser) {
        const user = await User.create({
          email: data.email,
          password: 'Teacher@123',
          full_name: data.full_name,
          role: 'teacher',
        });
        userId = user.id;
      } else {
        userId = existingUser.id;
      }
    }

    return Teacher.create({ ...data, user_id: userId });
  }

  async update(id, data) {
    const teacher = await Teacher.findByPk(id);
    if (!teacher) {
      throw new AppError('Không tìm thấy giảng viên', 404);
    }

    // ── Đồng bộ email sang bảng users để giảng viên đăng nhập được ──
    if (data.email !== undefined) {
      const displayName = data.full_name || teacher.full_name || '';

      if (data.email) {
        // Kiểm tra email mới có bị trùng với user khác không
        if (teacher.user_id) {
          const conflictUser = await User.findOne({
            where: { email: data.email, id: { [Op.ne]: teacher.user_id } },
          });
          if (conflictUser) {
            throw new AppError('Email này đã được sử dụng bởi tài khoản khác', 409);
          }
        } else {
          const conflictUser = await User.findOne({ where: { email: data.email } });
          if (conflictUser) {
            throw new AppError('Email này đã được sử dụng bởi tài khoản khác', 409);
          }
        }

        if (teacher.user_id) {
          // Giảng viên đã có tài khoản → cập nhật email + tên trong bảng users
          const user = await User.findByPk(teacher.user_id);
          if (user) {
            await user.update({ email: data.email, full_name: displayName || user.full_name });
          }
        } else {
          // Giảng viên chưa có tài khoản → tạo mới
          const newUser = await User.create({
            email: data.email,
            password: 'Teacher@123',
            full_name: displayName,
            role: 'teacher',
          });
          data.user_id = newUser.id;
        }
      }
    }

    // Nếu tên thay đổi mà email không đổi, vẫn đồng bộ tên sang users
    if (data.full_name !== undefined && data.email === undefined) {
      if (teacher.user_id) {
        const user = await User.findByPk(teacher.user_id);
        if (user && data.full_name) {
          await user.update({ full_name: data.full_name });
        }
      }
    }

    return teacher.update(data);
  }

  async delete(id) {
    const teacher = await Teacher.findByPk(id);
    if (!teacher) {
      throw new AppError('Không tìm thấy giảng viên', 404);
    }

    const studentCount = await Student.count({ where: { teacher_id: id } });
    if (studentCount > 0) {
      throw new AppError('Không thể xóa giảng viên đang hướng dẫn sinh viên', 400);
    }

    await teacher.destroy();
    return { message: 'Đã xóa giảng viên thành công' };
  }

  // Public list for student browsing — no auth required beyond login
  async getPublicList() {
    return Teacher.findAll({
      attributes: [
        'id',
        'teacher_code',
        'full_name',
        'department',
        'email',
        [fn('COUNT', col('students.id')), 'student_count'],
      ],
      include: [{ model: Student, as: 'students', attributes: [] }],
      group: ['Teacher.id'],
      order: [['full_name', 'ASC']],
      raw: true,
    });
  }
}

module.exports = new TeacherService();
