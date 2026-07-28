const router = require('express').Router();
const scoreController = require('../controllers/scoreController');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/role');
const validate = require('../middlewares/validate');
const { scoreSchema, scoreUpdateSchema } = require('../validators/score');

// Fix: Route /student/:studentId phải đứng TRƯỚC /:id để tránh conflict
router.get('/student/:studentId', auth, authorize('teacher', 'student', 'admin'), scoreController.getByStudentId);
router.get('/student/:studentId/final', auth, authorize('teacher', 'student', 'admin'), scoreController.getFinalScore);

router.post('/', auth, authorize('teacher'), validate(scoreSchema), scoreController.create);
router.put('/:id', auth, authorize('teacher'), validate(scoreUpdateSchema), scoreController.update);

module.exports = router;
