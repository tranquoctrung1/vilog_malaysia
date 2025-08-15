const mongoose = require("mongoose");
const ChannelModel = require("../../model/Channel.js");
const SiteModel = require("../../model/site");

module.exports.GetDataMultipleChannel = async function (req, res) {
  const multipleChannel = req.params.multipleChannel;
  const start = req.params.start;
  const end = req.params.end;

  let listChannel = multipleChannel.split("|");

  let data = [];

  let startDate = new Date(parseInt(start));
  let endDate = new Date(parseInt(end));

  for (let channelid of listChannel) {
    let DataLoggerSchema = new mongoose.Schema({
      TimeStamp: Date,
      Value: Number,
    });

    delete mongoose.models.DataLogger;

    let DataLogger = mongoose.model(
      "DataLogger",
      DataLoggerSchema,
      "t_Data_Logger_" + channelid
    );

    let result = await DataLogger.find({
      TimeStamp: { $gte: startDate, $lte: endDate },
    }).sort({ TimeStamp: 1 });

    let channels = await ChannelModel.find({ ChannelId: channelid });

    let location;

    let channelname;

    if (channels.length > 0) {
      if (
        channels[0].ChannelName != null &&
        channels[0].ChannelName != undefined
      ) {
        channelname = channels[0].ChannelName;

        let site = await SiteModel.find({ LoggerId: channels[0].LoggerId });

        if (site.length > 0) {
          location = site[0].Location;
        }
      }
    }

    result.push({ channelid, channelname, location });

    data.push(result);
  }

  res.json(data);
};

module.exports.GetDataMultipleChannelToCreateTable = async function (req, res) {
  const multipleChannel = req.params.multipleChannel;
  const start = req.params.start;
  const end = req.params.end;

  let listChannel = multipleChannel.split("|");

  let data = [];

  let startDate = new Date(parseInt(start));
  let endDate = new Date(parseInt(end));

  for (let channelid of listChannel) {
    let DataLoggerSchema = new mongoose.Schema({
      TimeStamp: Date,
      Value: Number,
    });

    delete mongoose.models.DataLogger;

    let DataLogger = mongoose.model(
      "DataLogger",
      DataLoggerSchema,
      "t_Data_Logger_" + channelid
    );

    let result = await DataLogger.find({
      TimeStamp: { $gte: startDate, $lte: endDate },
    }).sort({ TimeStamp: -1 });

    let channels = await ChannelModel.find({ ChannelId: channelid });

    let temp = [];

    if (channels.length > 0) {
      for (let item of result) {
        let obj = {};

        obj.TimeStamp = item.TimeStamp;
        obj.Value = item.Value.toFixed(2);
        obj.ChannelId = channels[0].ChannelId;
        obj.ChannelName = channels[0].ChannelName;

        temp.push(obj);
      }
    }

    data.push(temp);
  }

  res.json(data);
};
