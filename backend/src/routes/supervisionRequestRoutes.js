const router = require('express').Router();
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');
const ctrl = require('../controllers/supervisionRequestController');

// ── Admin: monitor all requests ────────────────────────────────────────────
router.get('/', auth, role('admin'), ctrl.getAll);

// ── Teacher: own inbox ─────────────────────────────────────────────────────
router.get('/teacher', auth, role('teacher'), ctrl.getByTeacher);
router.patch('/:id/approve', auth, role('teacher'), ctrl.approve);
router.patch('/:id/reject', auth, role('teacher'), ctrl.reject);

// ── Student: submit & view own requests ───────────────────────────────────
router.get('/student', auth, role('student'), ctrl.getByStudent);
router.post('/', auth, role('student'), ctrl.create);

// ── Notifications (all roles) ─────────────────────────────────────────────
router.get('/notifications', auth, ctrl.getNotifications);
router.patch('/notifications/:id/read', auth, ctrl.markRead);
router.patch('/notifications/read-all', auth, ctrl.markAllRead);

module.exports = router;
