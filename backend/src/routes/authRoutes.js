const router = require('express').Router();
const authController = require('../controllers/authController');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/role');
const validate = require('../middlewares/validate');
const { loginSchema, registerSchema } = require('../validators/auth');

router.post('/login', validate(loginSchema), authController.login);
router.post('/register', auth, authorize('admin'), validate(registerSchema), authController.register);
router.get('/me', auth, authController.getMe);

module.exports = router;
