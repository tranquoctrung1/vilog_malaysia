const express = require("express");
const router = express.Router();
const LostWaterController = require("../controller/alarmLostWater");

router.get("/", LostWaterController.LostWater);

module.exports = router;
