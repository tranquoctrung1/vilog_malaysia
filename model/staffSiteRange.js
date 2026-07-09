const mongoose = require("mongoose");

var staffSiteRangeSchema = new mongoose.Schema({
  IdUser: String,
  Field: String,
  From: Number,
  To: Number,
});

var StaffSiteRange = mongoose.model(
  "StaffSiteRange",
  staffSiteRangeSchema,
  "t_Staff_Site_Range"
);

module.exports = StaffSiteRange;
