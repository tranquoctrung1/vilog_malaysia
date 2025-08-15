const express = require("express");
const router = express.Router();
const DataManualController = require("../controller/dataManual");

router.get("/", DataManualController.dataManual);

module.exports = router;
