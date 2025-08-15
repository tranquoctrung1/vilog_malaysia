const mongoose = require("mongoose");
const SiteModel = require("../../model/site");
const ChannelModel = require("../../model/Channel.js");
const DataManualModel = require("../../model/DataManual");
const DisplayGroupModel = require("../../model/DisplayGroup");

module.exports.GetQuantityMonthDisplayGroup = async function (req, res) {
  let start = req.params.start;

  let result = [];

  let startDate = new Date(parseInt(start));

  let displayGroups = await DisplayGroupModel.find();

  if (displayGroups.length > 0) {
    for (let dg of displayGroups) {
      if (dg.Group != null && dg.Group != undefined && dg.Group.trim() != "") {
        let objDG = {};
        objDG.Name = dg.Group;
        objDG.Value = 0;

        let sites = await SiteModel.find({ DisplayGroup: dg.Group });

        if (sites.length > 0) {
          for (let site of sites) {
            if (site.LoggerId != null && site.LoggerId != undefined) {
              let listChannels = await ChannelModel.find({
                $and: [
                  { LoggerId: site.LoggerId },
                  {
                    $or: [
                      { ForwardFlow: { $eq: true } },
                      { ReverseFlow: { $eq: true } },
                    ],
                  },
                ],
              });

              let startDay = 0;
              let startHour = 0;

              try {
                startDay = site.StartDay;
              } catch (err) {
                console.log(err);
              }

              try {
                startHour = site.StartHour;
              } catch (err) {
                console.log(err);
              }

              let t = new Date(startDate);
              let t2 = new Date(startDate);

              if (startDate.getDate() < startDay) {
                t.setMonth(t.getMonth() - 1);
                t.setDate(1);
                t.setDate(t.getDate() + startDay - 1);
                t.setHours(7);
                t.setHours(t.getHours() + startHour);

                t2.setMonth(t2.getMonth() - 1);
                t2.setDate(1);
                t2.setDate(t2.getDate() + startDay - 1);
                t2.setHours(7);
                t2.setHours(t2.getHours() + startHour + 1);
              } else if (startDate.getDate() == startDay) {
                if (startDate.getHours() <= startHour) {
                  t.setMonth(t.getMonth() - 1);
                  t.setDate(1);
                  t.setDate(t.getDate() + startDay - 1);
                  t.setHours(7);
                  t.setHours(t.getHours() + startHour);

                  t2.setMonth(t2.getMonth() - 1);
                  t2.setDate(1);
                  t2.setDate(t2.getDate() + startDay - 1);
                  t2.setHours(7);
                  t2.setHours(t2.getHours() + startHour + 1);
                }
              } else {
                t.setDate(1);
                t.setDate(t.getDate() + startDay - 1);
                t.setHours(7);
                t.setHours(t.getHours() + startHour);

                t2.setDate(1);
                t2.setDate(t2.getDate() + startDay - 1);
                t2.setHours(7);
                t2.setHours(t2.getHours() + startHour + 1);
              }

              let indexManual = await DataManualModel.find({
                SiteId: site.SiteId,
                TimeStamp: t,
              });

              if (indexManual.length > 0) {
                objDG.Value += indexManual[0].Value;
              } else {
                let forwardFlowAfter = 0;
                let forwardFlowBefore = 0;
                let reverseFlowAfter = 0;
                let reverseFlowBefore = 0;
                let value = 0;

                let check1 = false;
                let check2 = false;
                let check3 = false;
                let check4 = false;

                for (let channel of listChannels) {
                  const DataLoggerSchema = new mongoose.Schema({
                    TimeStamp: Date,
                    Value: Number,
                  });

                  delete mongoose.models.DataLogger;

                  const DataLogger = mongoose.model(
                    "DataLogger",
                    DataLoggerSchema,
                    "t_Index_Logger_" + channel.ChannelId
                  );

                  // get lastest record
                  let value = await DataLogger.find({})
                    .sort({ TimeStamp: -1 })
                    .limit(1);

                  // get value in time
                  let value2 = await DataLogger.find({
                    TimeStamp: { $gte: t, $lt: t2 },
                  })
                    .sort({ TimeStamp: 1 })
                    .limit(1);

                  if (channel.ForwardFlow == true) {
                    if (value.length > 0) {
                      forwardFlowAfter = value[0].Value.toFixed(2);
                      check1 = true;
                    }

                    if (value2.length > 0) {
                      forwardFlowBefore = value2[0].Value.toFixed(2);
                      check2 = true;
                    }
                  } else if (channel.ReverseFlow == true) {
                    if (value.length > 0) {
                      reverseFlowAfter = value[0].Value.toFixed(2);
                      check3 = true;
                    }
                    if (value2.length > 0) {
                      reverseFlowBefore = value2[0].Value.toFixed(2);
                      check4 = true;
                    }
                  }
                }

                if (
                  (check1 == true || check3 == true) &&
                  (check2 == true || check4 == true)
                ) {
                  value =
                    forwardFlowAfter -
                    reverseFlowAfter -
                    (forwardFlowBefore - reverseFlowBefore);

                  if (value < 0) {
                    value = 0;
                  }
                }

                objDG.Value += value;
              }
            }
          }
        }
        result.push(objDG);
      }
    }
  }

  res.json(result);
};
