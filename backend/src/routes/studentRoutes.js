const router = require('express').Router();
const studentController = require('../controllers/studentController');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/role');
const validate = require('../middlewares/validate');
const { studentSchema, studentUpdateSchema } = require('../validators/student');
const { uploadImport } = require('../middlewares/upload');

// Fix: Routes without params must come BEFORE /:id
router.post('/import', auth, authorize('admin'), uploadImport.single('file'), studentController.import);
router.post('/delete-many', auth, authorize('admin'), studentController.deleteMany);
router.get('/batches', auth, authorize('admin'), studentController.getBatches);
router.get('/next-code', auth, authorize('admin'), studentController.getNextCode);

router.get('/', auth, authorize('admin', 'teacher'), studentController.getAll);
router.get('/:id', auth, studentController.getById);
router.post('/', auth, authorize('admin'), validate(studentSchema), studentController.create);
router.put('/:id', auth, authorize('admin'), validate(studentUpdateSchema), studentController.update);

router.delete('/:id', auth, authorize('admin'), studentController.delete);

module.exports = router;
