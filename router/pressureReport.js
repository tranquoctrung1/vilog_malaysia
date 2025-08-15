const express = require("express");
const router = express.Router();
const pressureReportController = require("../controller/pressureReport");

router.get("/", pressureReportController.pressureReport);
module.exports = router;
