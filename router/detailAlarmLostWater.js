const express = require("express");
const router = express.Router();
const DetailAlarmLostWaterController = require("../controller/detailAlarmLostWater");

router.get("/", DetailAlarmLostWaterController.detailAlarmLostWater);

module.exports = router;
