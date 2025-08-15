const express = require('express');
const router = express.Router();
const ConfigVilogController = require('../controller/configVilog');

router.get('/', ConfigVilogController.configVilog);

module.exports = router;
