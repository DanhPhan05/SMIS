const { Op, fn, col } = require('sequelize');
const { SupervisionRequest, Student, Teacher, User, Notification } = require('../models');
const { AppError, parsePagination, paginatedResponse } = require('../utils/helpers');

class SupervisionRequestService {
  // Admin: get all requests with filters
  async getAll(query) {
    const { page, limit, offset } = parsePagination(query);
    const { status, teacher_id, student_id } = query;

    const where = {};
    if (status) where.status = status;
    if (teacher_id) where.teacher_id = teacher_id;
    if (student_id) where.student_id = student_id;

    const { count, rows } = await SupervisionRequest.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'student_code', 'ho_ten_lot', 'ten', 'batch', 'email', 'company_id'],
          include: [{ model: require('../models/Company'), as: 'company', attributes: ['id', 'name'] }],
        },
        {
          model: Teacher,
          as: 'teacher',
          attributes: ['id', 'teacher_code', 'full_name', 'department'],
        },
      ],
    });

    return paginatedResponse(rows, count, page, limit);
  }

  // Teacher: get own inbox
  async getByTeacher(teacherId, query) {
    const { page, limit, offset } = parsePagination(query);
    const { status } = query;

    const where = { teacher_id: teacherId };
    if (status) where.status = status;

    const { count, rows } = await SupervisionRequest.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'student_code', 'ho_ten_lot', 'ten', 'batch', 'email', 'internship_status', 'company_id'],
          include: [{ model: require('../models/Company'), as: 'company', attributes: ['id', 'name'] }],
        },
      ],
    });

    return paginatedResponse(rows, count, page, limit);
  }

  // Student: get own requests
  async getByStudent(studentId) {
    return SupervisionRequest.findAll({
      where: { student_id: studentId },
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Teacher,
          as: 'teacher',
          attributes: ['id', 'teacher_code', 'full_name', 'department'],
        },
      ],
    });
  }

  // Student: submit a new request
  async create(studentId, teacherId, message) {
    const student = await Student.findByPk(studentId);
    if (!student) throw new AppError('Không tìm thấy sinh viên', 404);

    const teacher = await Teacher.findByPk(teacherId);
    if (!teacher) throw new AppError('Không tìm thấy giảng viên', 404);

    // Block if student already has an active PENDING request to this teacher
    const existing = await SupervisionRequest.findOne({
      where: { student_id: studentId, teacher_id: teacherId, status: 'PENDING' },
    });
    if (existing) {
      throw new AppError('Bạn đã có yêu cầu đang chờ xử lý với giảng viên này', 409);
    }

    const request = await SupervisionRequest.create({
      student_id: studentId,
      teacher_id: teacherId,
      message: message || null,
      status: 'PENDING',
      request_date: new Date(),
    });

    // Notify the teacher
    if (teacher.user_id) {
      await Notification.create({
        user_id: teacher.user_id,
        title: 'Yêu cầu hướng dẫn mới',
        message: `Sinh viên ${student.full_name} (${student.student_code}) đã gửi yêu cầu hướng dẫn thực tập.`,
        type: 'supervision_request',
        related_id: request.id,
        related_type: 'supervision_request',
      });
    }

    return request;
  }

  // Teacher: approve a request
  async approve(requestId, teacherId, responseNote) {
    const request = await SupervisionRequest.findOne({
      where: { id: requestId, teacher_id: teacherId },
    });
    if (!request) throw new AppError('Không tìm thấy yêu cầu', 404);
    if (request.status !== 'PENDING') {
      throw new AppError('Yêu cầu này đã được xử lý', 400);
    }

    await request.update({
      status: 'APPROVED',
      response_date: new Date(),
      response_note: responseNote || null,
    });

    // Update student's teacher_id
    await Student.update(
      { teacher_id: teacherId },
      { where: { id: request.student_id } }
    );

    // Notify the student
    const student = await Student.findByPk(request.student_id);
    const teacher = await Teacher.findByPk(teacherId);
    if (student?.user_id) {
      await Notification.create({
        user_id: student.user_id,
        title: 'Yêu cầu hướng dẫn được chấp thuận',
        message: `GV ${teacher?.full_name} đã chấp thuận yêu cầu hướng dẫn thực tập của bạn.`,
        type: 'request_approved',
        related_id: request.id,
        related_type: 'supervision_request',
      });
    }

    return request;
  }

  // Teacher: reject a request
  async reject(requestId, teacherId, responseNote) {
    const request = await SupervisionRequest.findOne({
      where: { id: requestId, teacher_id: teacherId },
    });
    if (!request) throw new AppError('Không tìm thấy yêu cầu', 404);
    if (request.status !== 'PENDING') {
      throw new AppError('Yêu cầu này đã được xử lý', 400);
    }

    await request.update({
      status: 'REJECTED',
      response_date: new Date(),
      response_note: responseNote || null,
    });

    // Notify the student
    const student = await Student.findByPk(request.student_id);
    const teacher = await Teacher.findByPk(teacherId);
    if (student?.user_id) {
      await Notification.create({
        user_id: student.user_id,
        title: 'Yêu cầu hướng dẫn bị từ chối',
        message: `GV ${teacher?.full_name} đã từ chối yêu cầu hướng dẫn thực tập của bạn.${responseNote ? ` Lý do: ${responseNote}` : ''}`,
        type: 'request_rejected',
        related_id: request.id,
        related_type: 'supervision_request',
      });
    }

    return request;
  }

  // Get unread notification count for a user
  async getUnreadCount(userId) {
    return Notification.count({ where: { user_id: userId, is_read: false } });
  }

  // Get notifications for a user
  async getNotifications(userId, limit = 20) {
    return Notification.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit,
    });
  }

  // Mark notification as read
  async markRead(notificationId, userId) {
    const notif = await Notification.findOne({ where: { id: notificationId, user_id: userId } });
    if (!notif) throw new AppError('Không tìm thấy thông báo', 404);
    await notif.update({ is_read: true });
    return notif;
  }

  // Mark all notifications as read for a user
  async markAllRead(userId) {
    await Notification.update({ is_read: true }, { where: { user_id: userId, is_read: false } });
    return { message: 'Đã đánh dấu tất cả thông báo là đã đọc' };
  }
}

module.exports = new SupervisionRequestService();
