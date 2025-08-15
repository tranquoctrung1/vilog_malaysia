const express = require("express");
const router = express.Router();
const DataHourLoggerController = require("../controller/dataHourLogger");

router.get("/", DataHourLoggerController.dataHourLogger);

module.exports = router;
