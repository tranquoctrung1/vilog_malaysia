const express = require("express");
const router = express.Router();
const SiteConfigController = require("../controller/siteConfig");

router.get("/", SiteConfigController.siteConfig);
module.exports = router;
