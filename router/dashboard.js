const express = require("express");
const router = express.Router();
const DashBoardController = require("../controller/dashboard");

router.get("/", DashBoardController.dashboard);

module.exports = router;
