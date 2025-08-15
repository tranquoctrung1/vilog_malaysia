const express = require("express");
const router = express.Router();
const QuantityMonthForcastController = require("../controller/quantityMonthForcast");

router.get("/", QuantityMonthForcastController.QuantityMonthForcast);

module.exports = router;
