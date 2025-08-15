const mongoose = require("mongoose");

var ChannelSchema = new mongoose.Schema({
  ChannelId: String,
  LoggerId: String,
  ChannelName: String,
  Unit: String,
  Pressure1: Boolean,
  Pressure2: Boolean,
  ForwardFlow: Boolean,
  ReverseFlow: Boolean,
  IndexTimeStamp: Date,
  LastValue: Number,
  LastIndex: Number,
  TimeStamp: Date,
  DisplayOnLable: Boolean,
  BaseLine: Number,
  BaseMin: Number,
  BaseMax: Number,
  OtherChannel: Boolean,
  BatSolarChannel: Boolean,
  BatMetterChannel: Boolean,
  BatLoggerChannel: Boolean,
  BatThreshold: Number,
  FromHour: Number,
  ToHour: Number,
});

var Channel = mongoose.model(
  "Channel",
  ChannelSchema,
  "t_Channel_Configurations"
);

module.exports = Channel;
