const router = require('express').Router();
const teacherController = require('../controllers/teacherController');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/role');
const validate = require('../middlewares/validate');
const { teacherSchema } = require('../validators/teacher');
const { uploadImport } = require('../middlewares/upload');

// Public list — students can browse teachers (authenticated, any role)
router.get('/public', auth, teacherController.getPublicList);

router.post('/import', auth, authorize('admin'), uploadImport.single('file'), teacherController.import);
router.get('/', auth, authorize('admin'), teacherController.getAll);
router.get('/next-code', auth, authorize('admin'), teacherController.getNextCode);
router.get('/:id', auth, authorize('admin', 'teacher'), teacherController.getById);
router.post('/', auth, authorize('admin'), validate(teacherSchema), teacherController.create);
router.put('/:id', auth, authorize('admin'), validate(teacherSchema), teacherController.update);
router.delete('/:id', auth, authorize('admin'), teacherController.delete);

module.exports = router;
