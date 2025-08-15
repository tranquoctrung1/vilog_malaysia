const mongoose = require("mongoose");

var roleSchema = new mongoose.Schema({
  Role: String,
  Description: String,
});

var Role = mongoose.model("Role", roleSchema, "t_Role");

module.exports = Role;
