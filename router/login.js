const express = require('express');
const router = express.Router();
const loginMiddleware = require('../middleware/login')

const login = require('../controller/login');

router.get('/', login.login);
router.post('/', loginMiddleware.loginValidation ,login.validationLoggin);
module.exports = router;