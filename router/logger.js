const express = require("express");
const router = express.Router();
const LoggerController = require("../controller/logger");

router.get("/", LoggerController.logger);

module.exports = router;
