const express = require("express");
const router = express.Router();
const PermissionStaffController = require("../controller/permissionStaff");

router.get("/", PermissionStaffController.permissionStaff);
module.exports = router;
