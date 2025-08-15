const express = require("express");
const router = express.Router();
const DashBoardTotalController = require("../controller/dashboardTotal");

router.get("/", DashBoardTotalController.dashboardTotal);

module.exports = router;
