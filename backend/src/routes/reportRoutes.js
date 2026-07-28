const router = require('express').Router();
const reportController = require('../controllers/reportController');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/role');
const validate = require('../middlewares/validate');
const { reportSchema, reportUpdateSchema, reportStatusSchema } = require('../validators/report');
const { uploadReport } = require('../middlewares/upload');

router.get('/', auth, reportController.getAll);
router.get('/:id', auth, reportController.getById);
router.post('/', auth, authorize('student'), uploadReport.single('file'), validate(reportSchema), reportController.create);
router.put('/:id', auth, authorize('student'), uploadReport.single('file'), validate(reportUpdateSchema), reportController.update);
router.put('/:id/status', auth, authorize('teacher'), validate(reportStatusSchema), reportController.updateStatus);

module.exports = router;
