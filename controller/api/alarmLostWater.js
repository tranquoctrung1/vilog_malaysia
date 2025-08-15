const mongoose = require("mongoose");
const SiteModel = require("../../model/site");
const ChannelModel = require("../../model/Channel.js");

module.exports.GetAlarmLostWater = async function (req, res) {
  let result = [];

  let sites = await SiteModel.find({});

  let count = 0;

  if (sites.length > 0) {
    for (let site of sites) {
      count += 1;
      if (count <= 50)
        if (site.LoggerId != null && site.LoggerId != undefined) {
          let channel = await ChannelModel.find({
            $and: [
              { LoggerId: site.LoggerId },
              {
                ForwardFlow: { $eq: true },
              },
            ],
          });

          if (channel.length > 0) {
            let obj = {};
            obj.SiteId = site.SiteId;
            obj.TimeStamp = null;
            obj.MNF = null;
            obj.Baseline = null;
            obj.Status = 0;
            obj.MNFSet = null;

            if (!site.hasOwnProperty("MNF")) {
              if (
                site.MNF != null &&
                site.MNF != undefined &&
                site.MNF.toString().trim() != ""
              ) {
                obj.MNFSet = site.MNF;
              }
            }

            const DataLoggerSchema = new mongoose.Schema({
              TimeStamp: Date,
              Value: Number,
            });

            delete mongoose.models.DataLogger;

            const DataLogger = mongoose.model(
              "DataLogger",
              DataLoggerSchema,
              "t_Data_Logger_" + channel[0].ChannelId
            );

            let time = await DataLogger.find({})
              .sort({ TimeStamp: -1 })
              .limit(1);

            if (time.length > 0) {
              if (time != null && time != undefined) {
                if (
                  time[0].TimeStamp != null &&
                  time[0].TimeStamp != undefined
                ) {
                  obj.TimeStamp = new Date(time[0].TimeStamp);
                }
              }
            }

            if (obj.TimeStamp != null) {
              let tempTime = new Date(obj.TimeStamp);
              tempTime.setHours(tempTime.getHours() - 7);

              let start = new Date(
                tempTime.getFullYear(),
                tempTime.getMonth(),
                tempTime.getDate(),
                7,
                0,
                0
              );
              let end = new Date(
                tempTime.getFullYear(),
                tempTime.getMonth(),
                tempTime.getDate(),
                12,
                0,
                0
              );

              let startSubD1 = new Date(
                tempTime.getFullYear(),
                tempTime.getMonth(),
                tempTime.getDate(),
                7,
                0,
                0
              );

              startSubD1.setDate(startSubD1.getDate() - 1);
              let endSubD1 = new Date(
                tempTime.getFullYear(),
                tempTime.getMonth(),
                tempTime.getDate(),
                12,
                0,
                0
              );

              endSubD1.setDate(endSubD1.getDate() - 1);

              let startSubD2 = new Date(
                tempTime.getFullYear(),
                tempTime.getMonth(),
                tempTime.getDate(),
                7,
                0,
                0
              );

              startSubD2.setDate(startSubD2.getDate() - 2);
              let endSubD2 = new Date(
                tempTime.getFullYear(),
                tempTime.getMonth(),
                tempTime.getDate(),
                12,
                0,
                0
              );

              endSubD2.setDate(endSubD2.getDate() - 2);

              let startSubD3 = new Date(
                tempTime.getFullYear(),
                tempTime.getMonth(),
                tempTime.getDate(),
                7,
                0,
                0
              );

              startSubD3.setDate(startSubD3.getDate() - 3);
              let endSubD3 = new Date(
                tempTime.getFullYear(),
                tempTime.getMonth(),
                tempTime.getDate(),
                12,
                0,
                0
              );

              endSubD3.setDate(endSubD3.getDate() - 3);

              // mnf current
              let value = await DataLogger.find({
                TimeStamp: { $gte: start, $lte: end },
              })
                .sort({ Value: 1 })
                .limit(1);

              // mnf sub day 1

              let valueSubD1 = await DataLogger.find({
                TimeStamp: { $gte: startSubD1, $lte: endSubD1 },
              })
                .sort({ Value: 1 })
                .limit(1);

              // mnf sub day 2
              let valueSubD2 = await DataLogger.find({
                TimeStamp: { $gte: startSubD2, $lte: endSubD2 },
              })
                .sort({ Value: 1 })
                .limit(1);

              // mnf sub day 3
              let valueSubD3 = await DataLogger.find({
                TimeStamp: { $gte: startSubD3, $lte: endSubD3 },
              })
                .sort({ Value: 1 })
                .limit(1);

              if (value.length > 0) {
                if (value != null && value != undefined) {
                  if (value[0].Value != null && value[0].Value != undefined) {
                    obj.MNF = value[0].Value.toFixed(2);
                  }
                }
              }

              if (
                valueSubD1.length > 0 &&
                valueSubD2.length > 0 &&
                valueSubD3.length > 0
              ) {
                if (
                  valueSubD1 != null &&
                  valueSubD1 != undefined &&
                  valueSubD2 != null &&
                  valueSubD2 != undefined &&
                  valueSubD3 != null &&
                  valueSubD3 != undefined
                ) {
                  if (
                    valueSubD1[0].Value != null &&
                    valueSubD1[0].Value != undefined &&
                    valueSubD2[0].Value != null &&
                    valueSubD2[0].Value != undefined &&
                    valueSubD3[0].Value != null &&
                    valueSubD3[0].Value != undefined
                  ) {
                    obj.Baseline = (
                      (valueSubD1[0].Value +
                        valueSubD2[0].Value +
                        valueSubD3[0].Value) /
                      3
                    ).toFixed(2);
                  }
                }
              }
            }

            if (obj.MNFSet != null) {
              if (obj.MNF > obj.MNFSet) {
                obj.Status = 1;
              } else if (obj.MNF > obj.Baseline * 1.1 && obj.MNF < obj.MNFSet) {
                obj.Status = 2;
              }
            } else {
              if (obj.MNF > obj.Baseline * 1.1) {
                obj.Status = 2;
              }
            }
            result.push(obj);
          }
        }
    }
  }

  res.json(result);
};
