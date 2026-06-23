const express = require('express');
const router = express.Router();
const ConfigVilogTableController = require('../controller/configVilogTable');

router.get('/', ConfigVilogTableController.configVilogTable);

module.exports = router;
