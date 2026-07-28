const router = require('express').Router();
const statsController = require('../controllers/statsController');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/role');

router.get('/overview', auth, authorize('admin'), statsController.overview);
router.get('/by-company', auth, authorize('admin'), statsController.byCompany);
router.get('/by-teacher', auth, authorize('admin'), statsController.byTeacher);
router.get('/by-batch', auth, authorize('admin'), statsController.byBatch);
router.get('/reports', auth, authorize('admin'), statsController.reports);
router.get('/scores', auth, authorize('admin'), statsController.scores);
router.get('/supervision-requests', auth, authorize('admin'), statsController.supervisionRequests);

module.exports = router;
