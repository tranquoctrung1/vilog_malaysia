const mongoose = require("mongoose");

var consumerSiteSchema = new mongoose.Schema({
  IdSite: String,
  IdUser: String,
});

var ConsumerSite = mongoose.model(
  "ConsumerSite",
  consumerSiteSchema,
  "t_Consumer_Site"
);

module.exports = ConsumerSite;
