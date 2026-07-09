const mongoose = require("mongoose");

var consumerSiteRangeSchema = new mongoose.Schema({
  IdUser: String,
  Field: String,
  From: Number,
  To: Number,
});

var ConsumerSiteRange = mongoose.model(
  "ConsumerSiteRange",
  consumerSiteRangeSchema,
  "t_Consumer_Site_Range"
);

module.exports = ConsumerSiteRange;
