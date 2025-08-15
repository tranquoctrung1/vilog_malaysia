const express = require("express");
const router = express.Router();
const CreateUserController = require("../controller/createUser");

router.get("/", CreateUserController.createUser);

module.exports = router;
