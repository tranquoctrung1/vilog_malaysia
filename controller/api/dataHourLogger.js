const mongoose = require("mongoose");
const SiteModel = require("../../model/site");
const ChannelModel = require("../../model/Channel.js");

module.exports.GetDataHourLogger = async function (req, res) {
  let siteid = req.params.siteid;
  let start = req.params.start;
  let end = req.params.end;

  let result = [];

  let startDate = new Date(parseInt(start));
  let endDate = new Date(parseInt(end));

  let spaceHour = (endDate.getTime() - startDate.getTime()) / (1000 * 3600);
  spaceHour += 1;

  let site = await SiteModel.find({ SiteId: siteid });

  if (site.length > 0) {
    if (site[0].LoggerId != null && site[0].LoggerId != undefined) {
      let listChannels = await ChannelModel.find({
        LoggerId: site[0].LoggerId,
      });

      for (let i = 0; i < spaceHour; i++) {
        let t = new Date(startDate);
        let t2 = new Date(startDate);
        t.setHours(t.getHours() + i);
        t2.setHours(t2.getHours() + i + 1);

        let obj = {};

        obj.TimeStamp = t;
        obj.ForwardFlow = 0;
        obj.ReverseFlow = 0;
        obj.ForwardIndex = 0;
        obj.ReverseIndex = 0;
        obj.Pressure1 = 0;
        obj.Pressure2 = 0;

        for (let channel of listChannels) {
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

          // get value for this time
          let value = await DataLogger.find({
            TimeStamp: { $gte: t, $lt: t2 },
          })
            .sort({ TimeStamp: 1 })
            .limit(1);

          // pressure1
          if (
            channel.Pressure1 == true &&
            channel.Pressure2 == false &&
            channel.ForwardFlow == false &&
            channel.ReverseFlow == false
          ) {
            if (value.length > 0) {
              obj.Pressure1 = value[0].Value.toFixed(2);
            }
          }
          // pressure2
          else if (
            channel.Pressure1 == false &&
            channel.Pressure2 == true &&
            channel.ForwardFlow == false &&
            channel.ReverseFlow == false
          ) {
            if (value.length > 0) {
              obj.Pressure2 = value[0].Value.toFixed(2);
            }
          }
          // forward flow
          else if (
            channel.Pressure1 == false &&
            channel.Pressure2 == false &&
            channel.ForwardFlow == true &&
            channel.ReverseFlow == false
          ) {
            if (value.length > 0) {
              obj.ForwardFlow = value[0].Value.toFixed(2);
            }

            delete mongoose.models.DataLogger;

            const DataLogger = mongoose.model(
              "DataLogger",
              DataLoggerSchema,
              "t_Index_Logger_" + channel.ChannelId
            );

            // get value index for this time
            let valueIndex = await DataLogger.find({
              TimeStamp: { $gte: t, $lt: t2 },
            })
              .sort({ TimeStamp: 1 })
              .limit(1);

            if (valueIndex.length > 0) {
              obj.ForwardIndex = valueIndex[0].Value.toFixed(2);
            }
          }
          // reverse flow
          else if (
            channel.Pressure1 == false &&
            channel.Pressure2 == false &&
            channel.ForwardFlow == false &&
            channel.ReverseFlow == true
          ) {
            if (value.length > 0) {
              obj.ReverseFlow = value[0].Value.toFixed(2);
            }

            delete mongoose.models.DataLogger;

            const DataLogger = mongoose.model(
              "DataLogger",
              DataLoggerSchema,
              "t_Index_Logger_" + channel.ChannelId
            );

            // get value index for this time
            let valueIndex = await DataLogger.find({
              TimeStamp: { $gte: t, $lt: t2 },
            })
              .sort({ TimeStamp: 1 })
              .limit(1);

            if (valueIndex.length > 0) {
              obj.ReverseIndex = valueIndex[0].Value.toFixed(2);
            }
          }
        }

        result.push(obj);
      }
    }
  }

  res.json(result);
};
