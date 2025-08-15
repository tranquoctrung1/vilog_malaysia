const express = require("express");
const router = express.Router();
const QuantityDayForcastController = require("../controller/quantityDayForcast");

router.get("/", QuantityDayForcastController.QuantityDayForcast);

module.exports = router;
