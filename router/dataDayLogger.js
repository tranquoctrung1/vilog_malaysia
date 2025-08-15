const express = require("express");
const router = express.Router();
const DataDayLoggerController = require("../controller/dataDayLogger");

router.get("/", DataDayLoggerController.dataDayLogger);

module.exports = router;
