const express = require("express");
const router = express.Router();
const mapController = require("../controller/map");
const authMiddleware = require("../middleware/auth");

//router.get('/', authMiddleware.auth ,mapController.map);
router.get("/", mapController.map);
module.exports = router;
