const { Op, fn, col, literal } = require('sequelize');
const { Student, Company, Teacher, WeeklyReport, Score, SupervisionRequest } = require('../models');

class StatsService {
  async getOverview() {
    const [
      totalStudents,
      totalCompanies,
      totalTeachers,
      totalReports,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
    ] = await Promise.all([
      Student.count(),
      Company.count(),
      Teacher.count(),
      WeeklyReport.count(),
      SupervisionRequest.count({ where: { status: 'PENDING' } }),
      SupervisionRequest.count({ where: { status: 'APPROVED' } }),
      SupervisionRequest.count({ where: { status: 'REJECTED' } }),
    ]);

    const statusCounts = await Student.findAll({
      attributes: ['internship_status', [fn('COUNT', col('id')), 'count']],
      group: ['internship_status'],
      raw: true,
    });

    // Internship completion rate
    const completedCount = statusCounts.find((s) => s.internship_status === 'completed');
    const completionRate =
      totalStudents > 0
        ? (((parseInt(completedCount?.count) || 0) / totalStudents) * 100).toFixed(1)
        : 0;

    return {
      totalStudents,
      totalCompanies,
      totalTeachers,
      totalReports,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      totalRequests: pendingRequests + approvedRequests + rejectedRequests,
      completionRate: parseFloat(completionRate),
      statusCounts,
    };
  }

  async getByBatch() {
    const rows = await Student.findAll({
      attributes: ['batch', [fn('COUNT', col('id')), 'count']],
      where: { batch: { [Op.ne]: null } },
      group: ['batch'],
      order: [['batch', 'ASC']],
      raw: true,
    });
    return rows;
  }

  async getByCompany() {
    return Company.findAll({
      attributes: ['id', 'name', [fn('COUNT', col('students.id')), 'student_count']],
      include: [{ model: Student, as: 'students', attributes: [] }],
      group: ['Company.id'],
      order: [[literal('student_count'), 'DESC']],
      raw: true,
    });
  }

  async getByTeacher() {
    return Teacher.findAll({
      attributes: [
        'id',
        'teacher_code',
        'full_name',
        [fn('COUNT', col('students.id')), 'student_count'],
      ],
      include: [{ model: Student, as: 'students', attributes: [] }],
      group: ['Teacher.id'],
      order: [[literal('student_count'), 'DESC']],
      raw: true,
    });
  }

  async getReportStats() {
    const statusCounts = await WeeklyReport.findAll({
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true,
    });

    // Weekly submissions (last 8 weeks)
    const weeklyTrend = await WeeklyReport.findAll({
      attributes: ['week_number', [fn('COUNT', col('id')), 'count']],
      group: ['week_number'],
      order: [['week_number', 'ASC']],
      raw: true,
    });

    const totalStudents = await Student.count();
    const studentsWithReports = await WeeklyReport.count({
      distinct: true,
      col: 'student_id',
    });
    const studentsNotSubmitted = totalStudents - studentsWithReports;

    return { statusCounts, totalStudents, studentsNotSubmitted, weeklyTrend };
  }

  async getSupervisionRequestStats() {
    const counts = await SupervisionRequest.findAll({
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true,
    });
    return counts;
  }

  async getScoreSummary() {
    const scores = await Score.findAll({
      include: [
        { model: Student, as: 'student', attributes: ['id', 'student_code', 'ho_ten_lot', 'ten'] },
        { model: Teacher, as: 'teacher', attributes: ['id', 'full_name'] },
      ],
      order: [['total_score', 'DESC']],
    });

    const avgScore =
      scores.length > 0
        ? (
            scores.reduce((sum, s) => sum + (parseFloat(s.total_score) || 0), 0) /
            scores.length
          ).toFixed(2)
        : 0;

    return { scores, averageScore: parseFloat(avgScore), totalGraded: scores.length };
  }
}

module.exports = new StatsService();
