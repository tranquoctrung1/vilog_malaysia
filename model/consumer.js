const mongoose = require("mongoose");

var consumerSchema = new mongoose.Schema({
  FullName: String,
  Telephone: String,
  Adrress: String,
});

var Consumer = mongoose.model("Consumer", consumerSchema, "t_Consumers");

module.exports = Consumer;
