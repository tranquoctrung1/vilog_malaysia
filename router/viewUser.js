const express = require("express");
const router = express.Router();
const ViewUserController = require("../controller/viewUser");

router.get("/", ViewUserController.viewUser);

module.exports = router;
