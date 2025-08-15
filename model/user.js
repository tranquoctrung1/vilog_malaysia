const mongoose = require("mongoose");

var userSchema = new mongoose.Schema({
  Username: String,
  Password: String,
  pfm: String,
  Salt: String,
  StaffId: String,
  ConsumerId: String,
  Email: String,
  Role: String,
  Active: Boolean,
  TimeStamp: Date,
  Ip: String,
  LoginTime: Number,
  Language: String,
});

var User = mongoose.model("User", userSchema, "t_Users");

module.exports = User;
