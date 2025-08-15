const express = require("express");
const router = express.Router();
const ViewStaffController = require("../controller/viewStaff");

router.get("/", ViewStaffController.viewStaff);

module.exports = router;
