const express = require("express");
const router = express.Router();
const TableDataCurrentController = require("../controller/tableDataCurrent");

router.get("/", TableDataCurrentController.tableDataCurrent);

module.exports = router;
