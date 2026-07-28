const router = require('express').Router();
const importLogController = require('../controllers/importLogController');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/role');

router.get('/', auth, authorize('admin'), importLogController.getAll);

module.exports = router;
