const express = require("express");
const router = express.Router();
const HistoryAlarmController = require('../controller/historyAlarm');

router.get("/", HistoryAlarmController.historyAlarm);

module.exports = router;
