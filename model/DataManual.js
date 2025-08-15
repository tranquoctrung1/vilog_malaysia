const mongoose = require("mongoose");

var dataManual = new mongoose.Schema({
  SiteId: String,
  TimeStamp: Date,
  Value: Number,
});

var DataManual = mongoose.model("DataManual", dataManual, "t_Data_Manual");

module.exports = DataManual;
