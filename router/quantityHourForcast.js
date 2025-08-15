const express = require("express");
const router = express.Router();
const QuantityHourForcastController = require("../controller/quantityHourForcast");

router.get("/", QuantityHourForcastController.QuantityHourForcast);

module.exports = router;
