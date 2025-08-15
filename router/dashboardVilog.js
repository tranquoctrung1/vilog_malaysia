const express = require("express");
const router = express.Router();
const DashBoardVilog = require('../controller/dashboardVilog');

router.get("/", DashBoardVilog.dashboardVilog);

module.exports = router;
