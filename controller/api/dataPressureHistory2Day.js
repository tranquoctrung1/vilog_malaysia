const mongoose = require("mongoose");
const SiteModel = require("../../model/site");
const ChannelModel = require("../../model/Channel.js");

module.exports.GetDataPressure2Day = async function (req, res) {
  let { siteid, start, end, startprev, endprev } = req.params;

  let startDate = new Date(parseInt(start));
  let endDate = new Date(parseInt(end));
  let startDatePrev = new Date(parseInt(startprev));
  let endDatePrev = new Date(parseInt(endprev));

  let result = [];

  let sites = await SiteModel.find({ SiteId: siteid });

  if (sites.length > 0) {
    if (sites[0].LoggerId != null && sites[0].LoggerId != undefined) {
      let channels = await ChannelModel.find({
        $and: [
          { LoggerId: sites[0].LoggerId },
          {
            $or: [{ Pressure1: { $eq: true } }, { Pressure2: { $eq: true } }],
          },
        ],
      });

      if (channels.length > 0) {
        if (channels != null && channels != undefined) {
          if (
            channels[0].ChannelId != null &&
            channels[0].ChannelId != undefined &&
            channels[0].ChannelId.trim() != ""
          ) {
            let channelid = channels[0].ChannelId;

            const DataLoggerSchema = new mongoose.Schema({
              TimeStamp: Date,
              Value: Number,
            });

            delete mongoose.models.DataLogger;

            const DataLogger = mongoose.model(
              "DataLogger",
              DataLoggerSchema,
              "t_Data_Logger_" + channelid
            );

            let dataPressure1 = await DataLogger.find({
              TimeStamp: { $gte: startDate, $lte: endDate },
            }).sort({ TimeStamp: 1 });

            let dataPressure2 = await DataLogger.find({
              TimeStamp: { $gte: startDatePrev, $lte: endDatePrev },
            }).sort({ TimeStamp: 1 });

            result.push(dataPressure1);
            if (dataPressure1.length > 0) {
              let tempData = [];
              for (let i = 0; i < dataPressure2.length; i++) {
                let obj = {};
                obj.TimeStamp = dataPressure1[i].TimeStamp;
                obj.Value = dataPressure2[i].Value;
                tempData.push(obj);
              }

              result.push(tempData);
            } else {
              result.push(dataPressure2);
            }
          }
        }
      }
    }
  }
  res.json(result);
};
