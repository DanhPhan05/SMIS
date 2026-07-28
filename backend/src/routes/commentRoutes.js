const router = require('express').Router();
const commentController = require('../controllers/commentController');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/role');
const validate = require('../middlewares/validate');
const { commentSchema } = require('../validators/score');

router.post('/', auth, authorize('teacher'), validate(commentSchema), commentController.create);
router.get('/report/:reportId', auth, authorize('teacher', 'student'), commentController.getByReportId);

module.exports = router;
