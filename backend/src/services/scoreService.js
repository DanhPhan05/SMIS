const { Score, Student, Teacher } = require('../models');
const { AppError } = require('../utils/helpers');

class ScoreService {
  /**
   * Tính điểm trung bình từ chuyên cần và chuyên môn
   */
  _calcAverage(attendance, professional) {
    if (attendance != null && professional != null) {
      return parseFloat(((parseFloat(attendance) + parseFloat(professional)) / 2).toFixed(2));
    }
    return null;
  }

  /**
   * Tạo mới điểm
   */
  async create(data, user) {
    const teacher = await Teacher.findOne({ where: { user_id: user.id } });
    if (!teacher) throw new AppError('Không tìm thấy thông tin giảng viên', 404);

    const student = await Student.findByPk(data.student_id);
    if (!student) throw new AppError('Không tìm thấy sinh viên', 404);
    if (student.teacher_id !== teacher.id) throw new AppError('Bạn không có quyền chấm điểm sinh viên này', 403);

    const scoreType = data.score_type || 'TEACHER';

    // Nếu sinh viên làm Đồ án → chỉ cho phép điểm TEACHER
    if (student.internship_type === 'DO_AN' && scoreType === 'COMPANY') {
      throw new AppError('Sinh viên làm đồ án không có điểm doanh nghiệp', 400);
    }

    // Kiểm tra đã có điểm cho loại này chưa
    const existing = await Score.findOne({
      where: { student_id: data.student_id, score_type: scoreType }
    });
    if (existing) {
      throw new AppError(`Đã có điểm ${scoreType === 'TEACHER' ? 'giảng viên' : 'công ty'} cho sinh viên này. Vui lòng cập nhật thay vì tạo mới`, 409);
    }

    // Tính điểm trung bình
    const average_score = this._calcAverage(data.attendance_score, data.professional_score);

    return Score.create({
      student_id: data.student_id,
      teacher_id: teacher.id,
      score_type: scoreType,
      attendance_score: data.attendance_score,
      professional_score: data.professional_score,
      average_score,
      notes: data.notes,
    });
  }

  /**
   * Cập nhật điểm
   */
  async update(id, data, user) {
    const score = await Score.findByPk(id);
    if (!score) throw new AppError('Không tìm thấy bản ghi điểm', 404);

    const teacher = await Teacher.findOne({ where: { user_id: user.id } });
    if (!teacher || score.teacher_id !== teacher.id) throw new AppError('Bạn không có quyền sửa điểm này', 403);

    const attendance = data.attendance_score ?? score.attendance_score;
    const professional = data.professional_score ?? score.professional_score;
    data.average_score = this._calcAverage(attendance, professional);

    return score.update(data);
  }

  /**
   * Lấy điểm theo student_id (tất cả loại)
   */
  async getByStudentId(studentId) {
    return Score.findAll({
      where: { student_id: studentId },
      include: [{ model: Teacher, as: 'teacher', attributes: ['id', 'full_name'] }],
      order: [['score_type', 'ASC']],
    });
  }

  /**
   * Lấy điểm tổng kết (final score) cho sinh viên
   * - THUC_TAP: 50% GV + 50% CT
   * - DO_AN: 100% GV
   */
  async getFinalScore(studentId) {
    const student = await Student.findByPk(studentId, {
      attributes: ['id', 'ho_ten_lot', 'ten', 'student_code', 'internship_type'],
    });
    if (!student) throw new AppError('Không tìm thấy sinh viên', 404);

    const scores = await Score.findAll({
      where: { student_id: studentId },
      include: [{ model: Teacher, as: 'teacher', attributes: ['id', 'full_name'] }],
    });

    const teacherScore = scores.find(s => s.score_type === 'TEACHER');
    const companyScore = scores.find(s => s.score_type === 'COMPANY');

    let finalScore = null;
    if (student.internship_type === 'THUC_TAP') {
      // 50% GV + 50% CT
      if (teacherScore?.average_score != null && companyScore?.average_score != null) {
        finalScore = parseFloat(((parseFloat(teacherScore.average_score) * 0.5) + (parseFloat(companyScore.average_score) * 0.5)).toFixed(2));
      }
    } else {
      // DO_AN: 100% GV
      if (teacherScore?.average_score != null) {
        finalScore = parseFloat(parseFloat(teacherScore.average_score).toFixed(2));
      }
    }

    return {
      student: {
        id: student.id,
        full_name: student.full_name,
        student_code: student.student_code,
        internship_type: student.internship_type,
      },
      teacherScore: teacherScore || null,
      companyScore: companyScore || null,
      finalScore,
    };
  }
}

module.exports = new ScoreService();
