const express = require("express");
const router = express.Router();
const DashBoardLevel = require('../controller/dashboardLevel');

router.get("/", DashBoardLevel.dashboardLevel);

module.exports = router;
