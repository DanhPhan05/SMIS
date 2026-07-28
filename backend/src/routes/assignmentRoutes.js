const router = require('express').Router();
const assignmentController = require('../controllers/assignmentController');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/role');

// Fix: /history/:studentId phải đứng TRƯỚC /:id
router.get('/history/:studentId', auth, authorize('admin'), assignmentController.getHistory);

router.get('/', auth, authorize('admin'), assignmentController.getAll);
router.post('/', auth, authorize('admin'), assignmentController.create);
router.put('/:id', auth, authorize('admin'), assignmentController.update);

module.exports = router;
