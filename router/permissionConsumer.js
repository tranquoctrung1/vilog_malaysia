const express = require("express");
const router = express.Router();
const PermissionConsumerController = require("../controller/permissionConsumer");

router.get("/", PermissionConsumerController.permissionConsumer);
module.exports = router;
