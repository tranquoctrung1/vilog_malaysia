const mongoose = require("mongoose");

var routerConfig = new mongoose.Schema({
  Role: String,
  Function: [{ Parent: String, Children: [{ name: String, url: String }] }],
});

var RouterConfig = mongoose.model(
  "routerConfig",
  routerConfig,
  "t_RouteConfig"
);

module.exports = RouterConfig;
