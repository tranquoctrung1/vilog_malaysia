const mongoose = require("mongoose");

var staffSchema = new mongoose.Schema({
  FullName: String,
  Telephone: String,
  Adrress: String,
});

var Staff = mongoose.model("Staff", staffSchema, "t_Staff");

module.exports = Staff;
