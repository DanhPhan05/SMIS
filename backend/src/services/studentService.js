const { Op } = require('sequelize');
const { Student, Company, Teacher, User } = require('../models');
const { AppError, parsePagination, paginatedResponse } = require('../utils/helpers');

class StudentService {
  async getNextStudentCode() {
    const yy = String(new Date().getFullYear()).slice(-2);
    const prefix = `K${yy}`;
    const students = await Student.findAll({
      attributes: ['student_code'],
      where: { student_code: { [Op.like]: `${prefix}%` } },
    });
    let maxNum = 0;
    for (const s of students) {
      if (s.student_code && s.student_code.startsWith(prefix)) {
        const num = parseInt(s.student_code.substring(prefix.length), 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    }
    return `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
  }
  async getAll(query) {
    const { page, limit, offset } = parsePagination(query);
    const {
      search,
      company_id,
      teacher_id,
      internship_status,
      batch,
      academic_status,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = query;

    const where = {};

    // Full-text search across multiple fields
    if (search) {
      where[Op.or] = [
        { student_code: { [Op.iLike]: `%${search}%` } },
        { ho_ten_lot: { [Op.iLike]: `%${search}%` } },
        { ten: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { class_name: { [Op.iLike]: `%${search}%` } },
        { batch: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (company_id) where.company_id = company_id;
    if (teacher_id) where.teacher_id = teacher_id;
    if (internship_status) where.internship_status = internship_status;
    if (batch) where.batch = batch;
    if (academic_status) where.academic_status = academic_status;

    // Validate sort field to prevent SQL injection
    const allowedSortFields = ['created_at', 'ho_ten_lot', 'ten', 'student_code', 'batch', 'internship_status'];
    const orderField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
    const orderDir = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const { count, rows } = await Student.findAndCountAll({
      where,
      limit,
      offset,
      order: [[orderField, orderDir]],
      include: [
        { model: Company, as: 'company', attributes: ['id', 'name'] },
        { model: Teacher, as: 'teacher', attributes: ['id', 'teacher_code', 'full_name'] },
      ],
    });

    return paginatedResponse(rows, count, page, limit);
  }

  async getByTeacherId(teacherId, query) {
    const { page, limit, offset } = parsePagination(query);
    const { search, internship_status, batch } = query;

    const where = { teacher_id: teacherId };
    if (search) {
      where[Op.or] = [
        { student_code: { [Op.iLike]: `%${search}%` } },
        { ho_ten_lot: { [Op.iLike]: `%${search}%` } },
        { ten: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (internship_status) where.internship_status = internship_status;
    if (batch) where.batch = batch;

    const { count, rows } = await Student.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        { model: Company, as: 'company', attributes: ['id', 'name'] },
      ],
    });

    return paginatedResponse(rows, count, page, limit);
  }

  async getById(id) {
    const student = await Student.findByPk(id, {
      include: [
        { model: Company, as: 'company' },
        { model: Teacher, as: 'teacher' },
        { model: User, as: 'user', attributes: ['id', 'email', 'status'] },
      ],
    });
    if (!student) {
      throw new AppError('Không tìm thấy sinh viên', 404);
    }
    return student;
  }

  async create(data) {
    // Auto-generate student_code if not provided
    if (!data.student_code) {
      data.student_code = await this.getNextStudentCode();
    }

    const existing = await Student.findOne({ where: { student_code: data.student_code } });
    if (existing) {
      throw new AppError('Mã sinh viên đã tồn tại', 409);
    }

    // Hỗ trợ cả full_name (cũ) lẫn ho_ten_lot+ten (mới)
    if (data.full_name && !data.ho_ten_lot && !data.ten) {
      const parts = data.full_name.trim().split(/\s+/);
      if (parts.length > 1) {
        data.ten = parts.pop();
        data.ho_ten_lot = parts.join(' ');
      } else {
        data.ho_ten_lot = '';
        data.ten = data.full_name.trim();
      }
    }

    const displayName = `${data.ho_ten_lot || ''} ${data.ten || ''}`.trim();

    let userId = null;
    if (data.email) {
      const existingUser = await User.findOne({ where: { email: data.email } });
      if (!existingUser) {
        const user = await User.create({
          email: data.email,
          password: 'Student@123',
          full_name: displayName,
          role: 'student',
        });
        userId = user.id;
      } else {
        userId = existingUser.id;
      }
    }

    // Remove full_name from data before creating (it's virtual)
    const { full_name, ...createData } = data;
    return Student.create({ ...createData, user_id: userId });
  }

  async update(id, data) {
    const student = await Student.findByPk(id);
    if (!student) {
      throw new AppError('Không tìm thấy sinh viên', 404);
    }

    // Hỗ trợ cả full_name (cũ) lẫn ho_ten_lot+ten (mới)
    if (data.full_name && !data.ho_ten_lot && !data.ten) {
      const parts = data.full_name.trim().split(/\s+/);
      if (parts.length > 1) {
        data.ten = parts.pop();
        data.ho_ten_lot = parts.join(' ');
      } else {
        data.ho_ten_lot = '';
        data.ten = data.full_name.trim();
      }
    }

    // ── Đồng bộ email sang bảng users để sinh viên đăng nhập được ──
    if (data.email !== undefined) {
      const displayName = `${data.ho_ten_lot || student.ho_ten_lot || ''} ${data.ten || student.ten || ''}`.trim();

      if (data.email) {
        // Kiểm tra email mới có bị trùng với user khác không
        if (student.user_id) {
          const conflictUser = await User.findOne({
            where: { email: data.email, id: { [Op.ne]: student.user_id } },
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

        if (student.user_id) {
          // Sinh viên đã có tài khoản → cập nhật email + tên trong bảng users
          const user = await User.findByPk(student.user_id);
          if (user) {
            await user.update({ email: data.email, full_name: displayName || user.full_name });
          }
        } else {
          // Sinh viên chưa có tài khoản → tạo mới
          const newUser = await User.create({
            email: data.email,
            password: 'Student@123',
            full_name: displayName,
            role: 'student',
          });
          data.user_id = newUser.id;
        }
      }
    }

    // Nếu tên thay đổi mà email không đổi, vẫn đồng bộ tên sang users
    if ((data.ho_ten_lot !== undefined || data.ten !== undefined) && data.email === undefined) {
      if (student.user_id) {
        const displayName = `${data.ho_ten_lot ?? student.ho_ten_lot ?? ''} ${data.ten ?? student.ten ?? ''}`.trim();
        if (displayName) {
          const user = await User.findByPk(student.user_id);
          if (user) {
            await user.update({ full_name: displayName });
          }
        }
      }
    }

    // Remove full_name from data before updating (it's virtual)
    const { full_name, ...updateData } = data;
    return student.update(updateData);
  }

  async delete(id) {
    const student = await Student.findByPk(id);
    if (!student) {
      throw new AppError('Không tìm thấy sinh viên', 404);
    }
    // GRADUATED students are never physically deleted — only deactivated
    if (student.academic_status === 'GRADUATED') {
      throw new AppError(
        'Không thể xóa sinh viên đã tốt nghiệp. Chuyển trạng thái sang INACTIVE nếu cần.',
        403
      );
    }
    await student.destroy();
    return { message: 'Đã xóa sinh viên thành công' };
  }

  async deleteMany(ids) {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new AppError('Vui lòng chọn ít nhất một sinh viên để xóa', 400);
    }

    const students = await Student.findAll({ where: { id: { [Op.in]: ids } } });
    
    const skipped = [];
    const deleted = [];

    for (const student of students) {
      if (student.academic_status === 'GRADUATED') {
        skipped.push({ id: student.id, student_code: student.student_code, reason: 'Đã tốt nghiệp' });
      } else {
        await student.destroy();
        deleted.push(student.id);
      }
    }

    const notFound = ids.filter(id => !students.find(s => s.id === id));

    return {
      message: `Đã xóa ${deleted.length} sinh viên thành công`,
      deleted_count: deleted.length,
      skipped_count: skipped.length,
      not_found_count: notFound.length,
      skipped,
    };
  }

  async getBatches() {
    const rows = await Student.findAll({
      attributes: ['batch'],
      where: { batch: { [Op.ne]: null } },
      group: ['batch'],
      order: [['batch', 'ASC']],
      raw: true,
    });
    return rows.map((r) => r.batch).filter(Boolean);
  }
}

module.exports = new StudentService();
