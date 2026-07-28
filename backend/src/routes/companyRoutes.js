const router = require('express').Router();
const companyController = require('../controllers/companyController');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/role');
const validate = require('../middlewares/validate');
const { companySchema } = require('../validators/company');
const { uploadImport } = require('../middlewares/upload');

// Fix: Route /import phải đứng TRƯỚC /:id, nếu không Express sẽ match "import" như một id
router.post('/import', auth, authorize('admin'), uploadImport.single('file'), companyController.import);

router.get('/', auth, authorize('admin', 'teacher'), companyController.getAll);
router.get('/:id', auth, authorize('admin', 'teacher'), companyController.getById);
router.post('/', auth, authorize('admin'), validate(companySchema), companyController.create);
router.put('/:id', auth, authorize('admin'), validate(companySchema), companyController.update);
router.delete('/:id', auth, authorize('admin'), companyController.delete);

module.exports = router;
