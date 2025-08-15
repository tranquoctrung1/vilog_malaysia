const express = require("express");
const router = express.Router();
const CameraOnlineController = require("../controller/cameraOnline");

router.get("/", CameraOnlineController.cameraOnline);

module.exports = router;
