const { Comment, WeeklyReport, Teacher, Student } = require('../models');
const { AppError } = require('../utils/helpers');

class CommentService {
  async create(data, user) {
    const teacher = await Teacher.findOne({ where: { user_id: user.id } });
    if (!teacher) {
      throw new AppError('Không tìm thấy thông tin giảng viên', 404);
    }

    const report = await WeeklyReport.findByPk(data.report_id);
    if (!report) {
      throw new AppError('Không tìm thấy báo cáo', 404);
    }

    // Verify teacher has access to this student's report
    const student = await Student.findByPk(report.student_id);
    if (!student || student.teacher_id !== teacher.id) {
      throw new AppError('Bạn không có quyền nhận xét báo cáo này', 403);
    }

    // Mark report as viewed if it was just submitted
    if (report.status === 'submitted') {
      await report.update({ status: 'viewed' });
    }

    return Comment.create({
      report_id: data.report_id,
      teacher_id: teacher.id,
      content: data.content,
    });
  }

  async getByReportId(reportId) {
    const comments = await Comment.findAll({
      where: { report_id: reportId },
      order: [['created_at', 'DESC']],
      include: [
        { model: Teacher, as: 'teacher', attributes: ['id', 'full_name'] },
      ],
    });
    return comments;
  }
}

module.exports = new CommentService();
