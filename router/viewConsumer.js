const express = require("express");
const router = express.Router();
const ViewConsumerController = require("../controller/viewConsumer");

router.get("/", ViewConsumerController.viewConsumer);

module.exports = router;
