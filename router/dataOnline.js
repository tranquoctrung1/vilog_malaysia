const express = require("express");
const router = express.Router();
const DataOnlineController = require("../controller/dataOnline");

router.get("/", DataOnlineController.dataOnline);

module.exports = router;
