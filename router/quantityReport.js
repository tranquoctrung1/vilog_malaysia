const express = require("express");
const router = express.Router();
const quantityReportController = require("../controller/quantityReport");

router.get("/hour", quantityReportController.quantityReport);
router.get("/day", quantityReportController.quantityDayReport);
router.get("/month", quantityReportController.quantityMonthReport);
router.get("/year", quantityReportController.quantityYearReport);
module.exports = router;
