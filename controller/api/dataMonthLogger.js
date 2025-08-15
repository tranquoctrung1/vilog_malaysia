const mongoose = require("mongoose");
const SiteModel = require("../../model/site");
const ChannelModel = require("../../model/Channel.js");

module.exports.GetDataMonthLogger = async function (req, res) {
  let siteid = req.params.siteid;
  let start = req.params.start;
  let end = req.params.end;

  let result = [];

  let startDate = new Date(parseInt(start));
  let endDate = new Date(parseInt(end));

  let spaceMonth = (endDate.getFullYear() - startDate.getFullYear()) * 12;
  spaceMonth -= startDate.getMonth();
  spaceMonth += endDate.getMonth();
  spaceMonth += 1;

  let site = await SiteModel.find({ SiteId: siteid });

  if (site.length > 0) {
    if (site[0].LoggerId != null && site[0].LoggerId != undefined) {
      let listChannels = await ChannelModel.find({
        LoggerId: site[0].LoggerId,
      });

      let startHour;
      let startDay;
      try {
        startHour = site[0].StartHour;
      } catch (err) {
        console.log(err);
      }

      try {
        startDay = site[0].StartDay;
      } catch (err) {
        console.log(err);
      }
      for (let i = 0; i < spaceMonth; i++) {
        let t = new Date(startDate);
        let t2 = new Date(startDate);
        t.setMonth(t.getMonth() + i);
        t2.setMonth(t2.getMonth() + i + 1);

        let obj = {};

        obj.TimeStamp = t;
        obj.MaxFlow = 0;
        obj.MinFlow = 0;
        obj.NetIndex = 0;
        obj.MaxPressure = 0;
        obj.MinPressure = 0;

        let indexForwardBefore = 0;
        let indexForwardAfter = 0;
        let indexReverseBefore = 0;
        let indexReverseAfter = 0;

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
          let minValue = await DataLogger.find({
            TimeStamp: { $gte: t, $lt: t2 },
          })
            .sort({ Value: 1 })
            .limit(1);

          let maxValue = await DataLogger.find({
            TimeStamp: { $gte: t, $lt: t2 },
          })
            .sort({ Value: -1 })
            .limit(1);

          if (channel.Pressure1 == true || channel.Pressure2 == true) {
            if (maxValue.length > 0) {
              obj.MaxPressure = maxValue[0].Value.toFixed(2);
            }

            if (minValue.length > 0) {
              obj.MinPressure = minValue[0].Value.toFixed(2);
            }
          } else if (
            channel.ForwardFlow == true ||
            channel.ReverseFlow == true
          ) {
            if (maxValue.length > 0) {
              obj.MaxFlow = maxValue[0].Value.toFixed(2);
            }

            if (minValue.length > 0) {
              obj.MinFlow = minValue[0].Value.toFixed(2);
            }

            let t3 = new Date(startDate);
            let t4 = new Date(startDate);
            let t5 = new Date(startDate);

            t3.setMonth(t3.getMonth() + i);
            t3.setDate(t3.getDate() + startDay - 1);
            t3.setHours(t3.getHours() + startHour);
            t4.setMonth(t4.getMonth() + i - 1);
            t4.setDate(t4.getDate() + startDay - 1);
            t4.setHours(t4.getHours() + startHour);
            t5.setMonth(t5.getMonth() + i + 1);
            t5.setDate(t5.getDate() + startDay - 1);
            t5.setHours(t5.getHours() + startHour);

            delete mongoose.models.DataLogger;

            const DataLogger = mongoose.model(
              "DataLogger",
              DataLoggerSchema,
              "t_Index_Logger_" + channel.ChannelId
            );

            let valueIndexBefore = await DataLogger.find({
              TimeStamp: { $gte: t4, $lt: t3 },
            })
              .sort({ TimeStamp: 1 })
              .limit(1);

            let valueIndexAfter = await DataLogger.find({
              TimeStamp: { $gte: t3, $lt: t5 },
            })
              .sort({ TimeStamp: 1 })
              .limit(1);
            if (channel.ForwardFlow == true) {
              if (valueIndexBefore.length > 0) {
                indexForwardBefore += valueIndexBefore[0].Value.toFixed(2);
              }

              if (valueIndexAfter.length > 0) {
                indexForwardAfter += valueIndexAfter[0].Value.toFixed(2);
              }
            } else if (channel.ReverseFlow == true) {
              if (valueIndexBefore.length > 0) {
                indexReverseBefore += valueIndexBefore[0].Value.toFixed(2);
              }

              if (valueIndexAfter.length > 0) {
                indexReverseAfter += valueIndexAfter[0].Value.toFixed(2);
              }
            }
          }
        }

        obj.NetIndex =
          indexForwardAfter -
          indexReverseAfter -
          (indexForwardBefore - indexReverseBefore);

        if (obj.NetIndex < 0) {
          obj.NetIndex = 0;
        }

        result.push(obj);
      }
    }
  }

  res.json(result);
};
