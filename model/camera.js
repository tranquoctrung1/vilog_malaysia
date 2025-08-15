const mongoose = require("mongoose");

var cameraSchema = new mongoose.Schema({
  Name: String,
  Ip: String,
  Port: Number,
  IpWeb: String,
});

var Camera = mongoose.model("Camera", cameraSchema, "Camera");

module.exports = Camera;
