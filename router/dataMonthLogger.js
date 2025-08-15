const express = require("express");
const router = express.Router();
const DataDayMonthController = require("../controller/dataMonthLogger");

router.get("/", DataDayMonthController.dataMonthLogger);

module.exports = router;
