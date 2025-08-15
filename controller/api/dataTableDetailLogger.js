const mongoose = require("mongoose");
const SiteModel = require("../../model/site");
const ChannelModel = require("../../model/Channel.js");

module.exports.GetDataTableDetailLogger = async function (req, res) {
  let siteid = req.params.siteid;
  let start = req.params.start;
  let end = req.params.end;

  let result = [];

  let startDate = new Date(parseInt(start));
  let endDate = new Date(parseInt(end));

  let site = await SiteModel.find({ SiteId: siteid });

  if (site.length > 0) {
    if (site[0].LoggerId != null && site[0].LoggerId != undefined) {
      let listChannels = await ChannelModel.find({
        LoggerId: site[0].LoggerId,
      });

      let interVal = 15;
      try {
        interVal = site[0].InterVal;
      } catch (err) {
        console.log(err);
      }

      let listDataForwardFlow = [];
      let listDataReverseFlow = [];
      let listDataPressure1 = [];
      let listDataPressure2 = [];
      let listDataIndexForward = [];
      let listDataIndexReverse = [];

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

        let value = await DataLogger.find({
          TimeStamp: { $gte: startDate, $lte: endDate },
        }).sort({ TimeStamp: 1 });

        if (channel.Pressure1 == true) {
          if (value.length > 0) {
            listDataPressure1 = value;
          }
        } else if (channel.Pressure2 == true) {
          if (value.length > 0) {
            listDataPressure2 = value;
          }
        } else if (channel.ForwardFlow == true) {
          if (value.length > 0) {
            listDataForwardFlow = value;
          }

          delete mongoose.models.DataLogger;

          const DataLogger = mongoose.model(
            "DataLogger",
            DataLoggerSchema,
            "t_Index_Logger_" + channel.ChannelId
          );

          let valueIndex = await DataLogger.find({
            TimeStamp: { $gte: startDate, $lte: endDate },
          }).sort({ TimeStamp: 1 });

          if (valueIndex.length > 0) {
            listDataIndexForward = valueIndex;
          }
        } else if (channel.ReverseFlow == true) {
          if (value.length > 0) {
            listDataReverseFlow = value;
          }

          delete mongoose.models.DataLogger;

          const DataLogger = mongoose.model(
            "DataLogger",
            DataLoggerSchema,
            "t_Index_Logger_" + channel.ChannelId
          );

          let valueIndex = await DataLogger.find({
            TimeStamp: { $gte: startDate, $lte: endDate },
          }).sort({ TimeStamp: 1 });

          if (valueIndex.length > 0) {
            listDataIndexReverse = valueIndex;
          }
        }
      }

      while (startDate <= endDate) {
        let t = new Date(startDate);
        let t2 = new Date(startDate);
        t2.setMinutes(t2.getMinutes() + interVal);

        let obj = {};
        obj.TimeStamp = t;
        obj.Pressure1 = 0;
        obj.Pressure2 = 0;
        obj.ForwardFlow = 0;
        obj.ReverseFlow = 0;
        obj.IndexForward = 0;
        obj.IndexReverse = 0;
        obj.IndexNet = 0;

        if (listDataPressure1.length > 0) {
          obj.Pressure1 = listDataPressure1.find(function (el) {
            return (
              el.TimeStamp.getTime() >= t.getTime() &&
              el.TimeStamp.getTime() < t2.getTime()
            );
          });
          if (obj.Pressure1 == undefined) {
            obj.Pressure1 = 0;
          } else {
            obj.Pressure1 = obj.Pressure1.Value;
          }
        }
        if (listDataPressure2.length > 0) {
          obj.Pressure2 = listDataPressure2.find(function (el) {
            return el.TimeStamp.getTime() >= t.getTime();
          });
          if (obj.Pressure2 == undefined) {
            obj.Pressure2 = 0;
          } else {
            obj.Pressure2 = obj.Pressure2.Value;
          }
        }
        if (listDataForwardFlow.length > 0) {
          obj.ForwardFlow = listDataForwardFlow.find(function (el) {
            return (
              el.TimeStamp.getTime() >= t.getTime() &&
              el.TimeStamp.getTime() < t2.getTime()
            );
          });
          if (obj.ForwardFlow == undefined) {
            obj.ForwardFlow = 0;
          } else {
            obj.ForwardFlow = obj.ForwardFlow.Value;
          }
        }
        if (listDataReverseFlow.length > 0) {
          obj.ReverseFlow = listDataReverseFlow.find(function (el) {
            return (
              el.TimeStamp.getTime() >= t.getTime() &&
              el.TimeStamp.getTime() < t2.getTime()
            );
          });
          if (obj.ReverseFlow == undefined) {
            obj.ReverseFlow = 0;
          } else {
            obj.ReverseFlow = obj.ReverseFlow.Value;
          }
        }
        if (listDataIndexForward.length > 0) {
          obj.IndexForward = listDataIndexForward.find(function (el) {
            return (
              el.TimeStamp.getTime() >= t.getTime() &&
              el.TimeStamp.getTime() < t2.getTime()
            );
          });
          if (obj.IndexForward == undefined) {
            obj.IndexForward = 0;
          } else {
            obj.IndexForward = obj.IndexForward.Value;
            obj.IndexNet += obj.IndexForward;
          }
        }
        if (listDataIndexReverse.length > 0) {
          obj.IndexReverse = listDataIndexReverse.find(function (el) {
            return (
              el.TimeStamp.getTime() >= t.getTime() &&
              el.TimeStamp.getTime() < t2.getTime()
            );
          });
          if (obj.IndexReverse == undefined) {
            obj.IndexReverse = 0;
          } else {
            obj.IndexReverse = obj.IndexReverse.Value;
            obj.IndexNet -= obj.IndexReverse;
          }
        }

        result.push(obj);

        startDate.setMinutes(startDate.getMinutes() + interVal);
      }
    }
  }

  res.json(result);
};
