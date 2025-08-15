const mongoose = require("mongoose");

var staffSiteSchema = new mongoose.Schema({
  IdSite: String,
  IdUser: String,
});

var StaffSite = mongoose.model("StaffSite", staffSiteSchema, "t_Staff_Site");

module.exports = StaffSite;
