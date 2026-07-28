const router = require('express').Router();

router.use('/auth', require('./authRoutes'));
router.use('/companies', require('./companyRoutes'));
router.use('/students', require('./studentRoutes'));
router.use('/teachers', require('./teacherRoutes'));
router.use('/assignments', require('./assignmentRoutes'));
router.use('/reports', require('./reportRoutes'));
router.use('/comments', require('./commentRoutes'));
router.use('/scores', require('./scoreRoutes'));
router.use('/stats', require('./statsRoutes'));
router.use('/import-logs', require('./importLogRoutes'));
router.use('/supervision-requests', require('./supervisionRequestRoutes'));

// API info
router.get('/', (req, res) => {
  res.json({
    name: 'SIMS 4.0 — Student Internship Management API',
    version: '4.0.0',
    endpoints: [
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET  /api/auth/me',
      'CRUD /api/companies',
      'CRUD /api/students',
      'GET  /api/students/batches',
      'POST /api/students/import',
      'CRUD /api/teachers',
      'GET  /api/teachers/public',
      'CRUD /api/assignments',
      'CRUD /api/reports',
      'CRUD /api/comments',
      'CRUD /api/scores',
      'GET  /api/stats/*',
      'GET  /api/import-logs',
      'GET  /api/supervision-requests (admin)',
      'GET  /api/supervision-requests/teacher (teacher)',
      'GET  /api/supervision-requests/student (student)',
      'POST /api/supervision-requests (student)',
      'PATCH /api/supervision-requests/:id/approve (teacher)',
      'PATCH /api/supervision-requests/:id/reject (teacher)',
      'GET  /api/supervision-requests/notifications',
    ],
  });
});

module.exports = router;
