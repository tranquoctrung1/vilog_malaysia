const mongoose = require("mongoose");
const SiteModel = require("../../model/site");
const ChannelModel = require("../../model/Channel.js");

module.exports.GetMinNightFlow = async function (req, res) {
  let { siteid, start, end } = req.params;

  let startDate = new Date(parseInt(start));
  let endDate = new Date(parseInt(end));

  let result = [];

  let arrayMNF = [];
  let arrayData = [];

  let spaceDay = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
  spaceDay += 1;

  let sites = await SiteModel.find({ SiteId: siteid });

  if (sites.length > 0) {
    if (sites[0].LoggerId != null && sites[0].LoggerId != undefined) {
      let channels = await ChannelModel.find({
        $and: [
          { LoggerId: sites[0].LoggerId },
          {
            $or: [
              { ForwardFlow: { $eq: true } },
              { ReverseFlow: { $eq: true } },
            ],
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

            for (let i = 0; i < spaceDay; i++) {
              let t = new Date(startDate);
              t.setHours(7);
              t.setDate(t.getDate() + i);
              let t2 = new Date(startDate);
              t2.setHours(12);
              t2.setDate(t2.getDate() + i);

              let data = await DataLogger.find({
                TimeStamp: { $gte: t, $lte: t2 },
              })
                .sort({ Value: 1 })
                .limit(1);

              if (data.length > 0) {
                if (data != null && data != undefined) {
                  let obj = {};
                  obj.TimeStamp = t;
                  obj.Value = data[0].Value;
                  arrayData.push(obj);
                }

                if (!sites[0].hasOwnProperty("MNF")) {
                  if (
                    sites[0].MNF != null &&
                    sites[0].MNF != undefined &&
                    sites[0].MNF.toString().trim() != ""
                  ) {
                    let obj2 = {};
                    obj2.TimeStamp = t;
                    obj2.Value = sites[0].MNF;
                    arrayMNF.push(obj2);
                  }
                }
              }
            }
            result.push(arrayData);
            result.push(arrayMNF);
          }
        }
      }
    }
  }
  res.json(result);
};
