const mongoose = require("mongoose");

var deviceLoggerSchema = new mongoose.Schema({
  Serial: String,
  DatePushStock: Date,
  Producer: String,
  Branch: String,
  Model: String,
  Status: String,
  Note: String,
  IsInstall: Boolean,
  urlUploadFile: String,
});

var DeviceLogger = mongoose.model(
  "deviceLoggerSchema",
  deviceLoggerSchema,
  "t_Logger"
);

module.exports = DeviceLogger;
