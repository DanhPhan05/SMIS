const supervisionRequestService = require('../services/supervisionRequestService');

// ── Admin ──────────────────────────────────────────────────────────────────
exports.getAll = async (req, res, next) => {
  try {
    const result = await supervisionRequestService.getAll(req.query);
    res.json(result);
  } catch (error) { next(error); }
};

// ── Teacher ────────────────────────────────────────────────────────────────
exports.getByTeacher = async (req, res, next) => {
  try {
    const teacher = req.user.teacherProfile || await require('../models').Teacher.findOne({ where: { user_id: req.user.id } });
    if (!teacher) return res.status(403).json({ message: 'Không tìm thấy hồ sơ giảng viên' });
    const result = await supervisionRequestService.getByTeacher(teacher.id, req.query);
    res.json(result);
  } catch (error) { next(error); }
};

// ── Student ────────────────────────────────────────────────────────────────
exports.getByStudent = async (req, res, next) => {
  try {
    const student = await require('../models').Student.findOne({ where: { user_id: req.user.id } });
    if (!student) return res.status(403).json({ message: 'Không tìm thấy hồ sơ sinh viên' });
    const requests = await supervisionRequestService.getByStudent(student.id);
    res.json(requests);
  } catch (error) { next(error); }
};

exports.create = async (req, res, next) => {
  try {
    const student = await require('../models').Student.findOne({ where: { user_id: req.user.id } });
    if (!student) return res.status(403).json({ message: 'Không tìm thấy hồ sơ sinh viên' });
    const { teacher_id, message } = req.body;
    if (!teacher_id) return res.status(400).json({ message: 'Vui lòng chọn giảng viên' });
    const request = await supervisionRequestService.create(student.id, teacher_id, message);
    res.status(201).json({ message: 'Đã gửi yêu cầu hướng dẫn', request });
  } catch (error) { next(error); }
};

exports.approve = async (req, res, next) => {
  try {
    const teacher = await require('../models').Teacher.findOne({ where: { user_id: req.user.id } });
    if (!teacher) return res.status(403).json({ message: 'Không tìm thấy hồ sơ giảng viên' });
    const { response_note } = req.body;
    const request = await supervisionRequestService.approve(req.params.id, teacher.id, response_note);
    res.json({ message: 'Đã chấp thuận yêu cầu', request });
  } catch (error) { next(error); }
};

exports.reject = async (req, res, next) => {
  try {
    const teacher = await require('../models').Teacher.findOne({ where: { user_id: req.user.id } });
    if (!teacher) return res.status(403).json({ message: 'Không tìm thấy hồ sơ giảng viên' });
    const { response_note } = req.body;
    const request = await supervisionRequestService.reject(req.params.id, teacher.id, response_note);
    res.json({ message: 'Đã từ chối yêu cầu', request });
  } catch (error) { next(error); }
};

// ── Notifications ──────────────────────────────────────────────────────────
exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await supervisionRequestService.getNotifications(req.user.id);
    const unreadCount = await supervisionRequestService.getUnreadCount(req.user.id);
    res.json({ notifications, unreadCount });
  } catch (error) { next(error); }
};

exports.markRead = async (req, res, next) => {
  try {
    const notif = await supervisionRequestService.markRead(req.params.id, req.user.id);
    res.json(notif);
  } catch (error) { next(error); }
};

exports.markAllRead = async (req, res, next) => {
  try {
    const result = await supervisionRequestService.markAllRead(req.user.id);
    res.json(result);
  } catch (error) { next(error); }
};
