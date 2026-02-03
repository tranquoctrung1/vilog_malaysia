const express = require('express');
const router = express.Router();
const ConfigTelegramController = require('../controller/configTelegram');

router.get('/', ConfigTelegramController.configTelegram);

module.exports = router;
