const express = require("express");
const router = express.Router();
const DataTableDetailLoggerController = require("../controller/dataTableDetailLogger");

router.get("/", DataTableDetailLoggerController.dataTableDetailLogger);

module.exports = router;
