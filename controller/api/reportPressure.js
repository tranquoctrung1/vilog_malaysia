const mongoose = require("mongoose");
const SiteModel = require("../../model/site");
const ChannelModel = require("../../model/Channel.js");

module.exports.GetReportPressure = async function (req, res) {
  let siteid = req.params.siteid;
  let start = req.params.start;
  let end = req.params.end;

  let result = [];

  let startDate = new Date(parseInt(start));
  let endDate = new Date(parseInt(end));

  let spaceDay = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
  spaceDay += 1;

  // get all site
  let listSites = await SiteModel.find({ SiteId: siteid });

  if (listSites != null && listSites != undefined) {
    if (listSites.length > 0) {
      for (let item of listSites) {
        let obj = {};

        obj.SiteId = item.SiteId;
        obj.data = [];

        let listChannels = await ChannelModel.find({
          $and: [
            { LoggerId: item.LoggerId },
            {
              $or: [{ Pressure1: { $eq: true } }, { Pressure2: { $eq: true } }],
            },
          ],
        });

        for (let i = 0; i < spaceDay; i++) {
          let t = new Date(startDate);
          let t2 = new Date(startDate);
          t.setDate(t.getDate() + i);
          t2.setDate(t2.getDate() + i + 1);
          t2.setSeconds(t2.getSeconds() - 1);

          let obj2 = {};

          obj2.TimeStamp = t;

          obj2.Pressure1 = null;
          obj2.Pressure2 = null;
          obj2.maxPressure1 = null;
          obj2.maxPressure2 = null;
          obj2.minPressure1 = null;
          obj2.minPressure2 = null;

          // get data in data Logger
          for (let channel of listChannels) {
            let isPressure1 = false;
            if (channel.Pressure1 == true) {
              isPressure1 = true;
            } else {
              isPressure1 = false;
            }
            const DataLoggerSchema = new mongoose.Schema({
              TimeStamp: Date,
              Value: Number,
            });

            delete mongoose.models.DataLogger;

            const DataLogger = mongoose.model(
              "DataLogger",
              DataLoggerSchema,
              "t_Data_Logger_" + channel.ChannelId
            );

            let currentValue = await DataLogger.find({
              TimeStamp: { $gte: t, $lte: t2 },
            })
              .sort({ TimeStamp: 1 })
              .limit(1);

            console.log(currentValue);

            let minValue = await DataLogger.find({
              TimeStamp: { $gte: t, $lte: t2 },
            })
              .sort({ Value: 1 })
              .limit(1);
            let maxValue = await DataLogger.find({
              TimeStamp: { $gte: t, $lte: t2 },
            })
              .sort({ Value: -1 })
              .limit(1);

            if (currentValue.length > 0) {
              currentValue = currentValue[0].Value.toFixed(2);
            }
            if (minValue.length > 0) {
              minValue = minValue[0].Value.toFixed(2);
            }
            if (maxValue.length > 0) {
              maxValue = maxValue[0].Value.toFixed(2);
            }
            if (isPressure1 == true) {
              obj2.Pressure1 = currentValue;
              obj2.maxPressure1 = maxValue;
              obj2.minPressure1 = minValue;
            } else {
              obj2.Pressure2 = currentValue;
              obj2.maxPressure2 = maxValue;
              obj2.minPressure2 = minValue;
            }
          }
          obj.data.push(obj2);
        }

        result.push(obj);
      }
    }
  }
  res.json(result);
};
