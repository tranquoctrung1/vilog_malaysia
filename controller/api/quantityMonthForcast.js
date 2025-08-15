const mongoose = require("mongoose");
const SiteModel = require("../../model/site");
const ChannelModel = require("../../model/Channel.js");
const DataManualModel = require("../../model/DataManual");

module.exports.QuantityMonthForcast = async function (req, res) {
  let { siteid, start, end } = req.params;

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
        $and: [
          { LoggerId: site[0].LoggerId },
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
        startDay = site[0].StartDay;
      } catch (err) {
        console.log(err);
      }

      try {
        startHour = site[0].StartHour;
      } catch (err) {
        console.log(err);
      }

      // 3d nearby previous
      let startSubDate1 = new Date(startDate);
      startSubDate1.setFullYear(startSubDate1.getFullYear() - 1);

      for (let i = 0; i < spaceMonth; i++) {
        let t = new Date(startDate);
        let t2 = new Date(startDate);
        let t3 = new Date(startDate);
        t.setMonth(t.getMonth() + i - 1);
        t.setDate(t.getDate() + startDay - 1);
        t.setHours(t.getHours() + startHour);
        t2.setMonth(t2.getMonth() + i);
        t2.setDate(t2.getDate() + startDay - 1);
        t2.setHours(t2.getHours() + startHour);
        t3.setMonth(t3.getMonth() + i + 1);
        t3.setDate(t3.getDate() + startDay - 1);
        t3.setHours(t3.getHours() + startHour);

        // variable current
        let forwardCurrentBefore = null;
        let forwardCurrentAfter = null;
        let reverseCurrentBefore = null;
        let reverseCurrentAfter = null;

        // varialbe by month

        let forwardSubH1Before = null;
        let forwardSubH1After = null;
        let reverseSubH1Before = null;
        let reverseSubH1After = null;
        let forwardSubH2Before = null;
        let forwardSubH2After = null;
        let reverseSubH2Before = null;
        let reverseSubH2After = null;
        let forwardSubH3Before = null;
        let forwardSubH3After = null;
        let reverseSubH3Before = null;
        let reverseSubH3After = null;

        // variable by year;

        let forwardSubD1Before = null;
        let forwardSubD1After = null;
        let reverseSubD1Before = null;
        let reverseSubD1After = null;

        // 3d nearby previous

        //let startSubH1 = new Date(startDate);
        //startSubH1.setHours(startSubH1.getHours() - 1);

        let startSubH2 = new Date(startDate);
        startSubH2.setMonth(startSubH2.getMonth() - 2 + i);

        let startSubH3 = new Date(startDate);
        startSubH3.setMonth(startSubH3.getMonth() - 3 + i);

        let startSubH4 = new Date(startDate);
        startSubH4.setMonth(startSubH4.getMonth() - 4 + i);

        //1y nearby previous
        let tSubDate1 = new Date(startSubDate1);
        tSubDate1.setMonth(tSubDate1.getMonth() - 1 + i);
        tSubDate1.setDate(tSubDate1.getDate() + startDay - 1);
        tSubDate1.setHours(tSubDate1.getHours() + startHour);
        let t2SubDate1 = new Date(startSubDate1);
        t2SubDate1.setMonth(t2SubDate1.getMonth() + i);
        t2SubDate1.setDate(t2SubDate1.getDate() + startDay - 1);
        t2SubDate1.setHours(t2SubDate1.getHours() + startHour);
        let t3SubDate1 = new Date(startSubDate1);
        t3SubDate1.setMonth(t3SubDate1.getMonth() + i + 1);
        t3SubDate1.setDate(t3SubDate1.getDate() + startDay - 1);
        t3SubDate1.setHours(t3SubDate1.getHours() + startHour);

        let obj = {};

        obj.TimeStamp = t2;
        obj.Value = 0;
        obj.ForcastValue = 0;

        let indexManual = await DataManualModel.find({
          SiteId: site[0].SiteId,
          TimeStamp: t2,
        });

        if (indexManual.length > 0) {
          obj.Value = indexManual[0].Value;
          //   obj.ForwardFlowBefore = {};
          //   obj.ForwardFlowBefore.TimeStamp = t;
          //   obj.ForwardFlowBefore.Value = 0;

          //   obj.ForwardFlowAfter = {};
          //   obj.ForwardFlowAfter.TimeStamp = t2;
          //   obj.ForwardFlowAfter.Value = 0;

          //   obj.ReverseFlowBefore = {};
          //   obj.ReverseFlowBefore.TimeStamp = t;
          //   obj.ReverseFlowBefore.Value = 0;

          //   obj.ReverseFlowAfter = {};
          //   obj.ReverseFlowAfter.TimeStamp = t2;
          //   obj.ReverseFlowAfter.Value = 0;

          result.push(obj);
        } else {
          //   obj.ForwardFlowBefore = {};
          //   obj.ForwardFlowBefore.TimeStamp = t;
          //   obj.ForwardFlowBefore.Value = 0;

          //   obj.ForwardFlowAfter = {};
          //   obj.ForwardFlowAfter.TimeStamp = t2;
          //   obj.ForwardFlowAfter.Value = 0;

          //   obj.ReverseFlowBefore = {};
          //   obj.ReverseFlowBefore.TimeStamp = t;
          //   obj.ReverseFlowBefore.Value = 0;

          //   obj.ReverseFlowAfter = {};
          //   obj.ReverseFlowAfter.TimeStamp = t2;
          //   obj.ReverseFlowAfter.Value = 0;

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

            let value = await DataLogger.find({
              TimeStamp: { $gte: t, $lt: t2 },
            })
              .sort({ TimeStamp: 1 })
              .limit(1);

            let value2 = await DataLogger.find({
              TimeStamp: { $gte: t2, $lt: t3 },
            })
              .sort({ TimeStamp: 1 })
              .limit(1);

            // calc quantity 1h previous
            let valueSubH1 = await DataLogger.find({
              TimeStamp: { $gte: startSubH2, $lt: t },
            })
              .sort({ TimeStamp: 1 })
              .limit(1);

            let valueSubH12 = await DataLogger.find({
              TimeStamp: { $gte: t, $lt: t2 },
            })
              .sort({ TimeStamp: 1 })
              .limit(1);

            // calc quantity 2h previous

            let valueSubH2 = await DataLogger.find({
              TimeStamp: { $gte: startSubH3, $lt: startSubH2 },
            })
              .sort({ TimeStamp: 1 })
              .limit(1);

            let valueSubH22 = await DataLogger.find({
              TimeStamp: { $gte: startSubH2, $lt: t },
            })
              .sort({ TimeStamp: 1 })
              .limit(1);

            // calc quantity 3h previous
            let valueSubH3 = await DataLogger.find({
              TimeStamp: { $gte: startSubH4, $lt: startSubH3 },
            })
              .sort({ TimeStamp: 1 })
              .limit(1);

            let valueSubH32 = await DataLogger.find({
              TimeStamp: { $gte: startSubH3, $lt: startSubH2 },
            })
              .sort({ TimeStamp: 1 })
              .limit(1);

            // calc quantity 1d previous
            let valueSubD1 = await DataLogger.find({
              TimeStamp: { $gte: tSubDate1, $lt: t2SubDate1 },
            })
              .sort({ TimeStamp: 1 })
              .limit(1);

            let valueSubD12 = await DataLogger.find({
              TimeStamp: { $gte: t2SubDate1, $lt: t3SubDate1 },
            })
              .sort({ TimeStamp: 1 })
              .limit(1);

            if (channel.ForwardFlow == true) {
              if (value.length > 0) {
                if (value != null && value != undefined) {
                  if (value[0] != null && value[0] != undefined) {
                    if (value[0].Value != null && value[0].Value != undefined) {
                      forwardCurrentBefore = value[0].Value.toFixed(2);
                    }
                  }
                }
              }

              if (value2.length > 0) {
                if (value2 != null && value2 != undefined) {
                  if (value2[0] != null && value2[0] != undefined) {
                    if (
                      value2[0].Value != null &&
                      value2[0].Value != undefined
                    ) {
                      forwardCurrentAfter = value2[0].Value.toFixed(2);
                    }
                  }
                }
              }
              // h
              if (valueSubH1.length > 0) {
                if (valueSubH1 != null && valueSubH1 != undefined) {
                  if (valueSubH1[0] != null && valueSubH1[0] != undefined) {
                    if (
                      valueSubH1[0].Value != null &&
                      valueSubH1[0].Value != undefined
                    ) {
                      forwardSubH1Before = valueSubH1[0].Value;
                    }
                  }
                }
              }
              if (valueSubH12.length > 0) {
                if (valueSubH12 != null && valueSubH12 != undefined) {
                  if (valueSubH12[0] != null && valueSubH12[0] != undefined) {
                    if (
                      valueSubH12[0].Value != null &&
                      valueSubH12[0].Value != undefined
                    ) {
                      forwardSubH1After = valueSubH12[0].Value;
                    }
                  }
                }
              }
              if (valueSubH2.length > 0) {
                if (valueSubH2 != null && valueSubH2 != undefined) {
                  if (valueSubH2[0] != null && valueSubH2[0] != undefined) {
                    if (
                      valueSubH2[0].Value != null &&
                      valueSubH2[0].Value != undefined
                    ) {
                      forwardSubH2Before = valueSubH2[0].Value;
                    }
                  }
                }
              }
              if (valueSubH22.length > 0) {
                if (valueSubH22 != null && valueSubH22 != undefined) {
                  if (valueSubH22[0] != null && valueSubH22[0] != undefined) {
                    if (
                      valueSubH22[0].Value != null &&
                      valueSubH22[0].Value != undefined
                    ) {
                      forwardSubH2After = valueSubH22[0].Value;
                    }
                  }
                }
              }
              if (valueSubH3.length > 0) {
                if (valueSubH3 != null && valueSubH3 != undefined) {
                  if (valueSubH3[0] != null && valueSubH3[0] != undefined) {
                    if (
                      valueSubH3[0].Value != null &&
                      valueSubH3[0].Value != undefined
                    ) {
                      forwardSubH3Before = valueSubH3[0].Value;
                    }
                  }
                }
              }
              if (valueSubH32.length > 0) {
                if (valueSubH32 != null && valueSubH32 != undefined) {
                  if (valueSubH32[0] != null && valueSubH32[0] != undefined) {
                    if (
                      valueSubH32[0].Value != null &&
                      valueSubH32[0].Value != undefined
                    ) {
                      forwardSubH3After = valueSubH32[0].Value;
                    }
                  }
                }
              }
              // d
              if (valueSubD1.length > 0) {
                if (valueSubD1 != null && valueSubD1 != undefined) {
                  if (valueSubD1[0] != null && valueSubD1[0] != undefined) {
                    if (
                      valueSubD1[0].Value != null &&
                      valueSubD1[0].Value != undefined
                    ) {
                      forwardSubD1Before = valueSubD1[0].Value;
                    }
                  }
                }
              }
              if (valueSubD12.length > 0) {
                if (valueSubD12 != null && valueSubD12 != undefined) {
                  if (valueSubD12[0] != null && valueSubD12[0] != undefined) {
                    if (
                      valueSubD12[0].Value != null &&
                      valueSubD12[0].Value != undefined
                    ) {
                      forwardSubD1After = valueSubD12[0].Value;
                    }
                  }
                }
              }
            } else if (channel.ReverseFlow == true) {
              if (value.length > 0) {
                if (value != null && value != undefined) {
                  if (value[0] != null && value[0] != undefined) {
                    if (value[0].Value != null && value[0].Value != undefined) {
                      reverseCurrentBefore = value[0].Value.toFixed(2);
                    }
                  }
                }
              }

              if (value2.length > 0) {
                if (value2 != null && value2 != undefined) {
                  if (value2[0] != null && value2[0] != undefined) {
                    if (
                      value2[0].Value != null &&
                      value2[0].Value != undefined
                    ) {
                      reverseCurrentAfter = value2[0].Value.toFixed(2);
                    }
                  }
                }
              }
              // h
              if (valueSubH1.length > 0) {
                if (valueSubH1 != null && valueSubH1 != undefined) {
                  if (valueSubH1[0] != null && valueSubH1[0] != undefined) {
                    if (
                      valueSubH1[0].Value != null &&
                      valueSubH1[0].Value != undefined
                    ) {
                      reverseSubH1Before = valueSubH1[0].Value;
                    }
                  }
                }
              }
              if (valueSubH12.length > 0) {
                if (valueSubH12 != null && valueSubH12 != undefined) {
                  if (valueSubH12[0] != null && valueSubH12[0] != undefined) {
                    if (
                      valueSubH12[0].Value != null &&
                      valueSubH12[0].Value != undefined
                    ) {
                      reverseSubH1After = valueSubH12[0].Value;
                    }
                  }
                }
              }
              if (valueSubH2.length > 0) {
                if (valueSubH2 != null && valueSubH2 != undefined) {
                  if (valueSubH2[0] != null && valueSubH2[0] != undefined) {
                    if (
                      valueSubH2[0].Value != null &&
                      valueSubH2[0].Value != undefined
                    ) {
                      reverseSubH2Before = valueSubH2[0].Value;
                    }
                  }
                }
              }
              if (valueSubH22.length > 0) {
                if (valueSubH22 != null && valueSubH22 != undefined) {
                  if (valueSubH22[0] != null && valueSubH22[0] != undefined) {
                    if (
                      valueSubH22[0].Value != null &&
                      valueSubH22[0].Value != undefined
                    ) {
                      reverseSubH2After = valueSubH22[0].Value;
                    }
                  }
                }
              }
              if (valueSubH3.length > 0) {
                if (valueSubH3 != null && valueSubH3 != undefined) {
                  if (valueSubH3[0] != null && valueSubH3[0] != undefined) {
                    if (
                      valueSubH3[0].Value != null &&
                      valueSubH3[0].Value != undefined
                    ) {
                      reverseSubH3Before = valueSubH3[0].Value;
                    }
                  }
                }
              }
              if (valueSubH32.length > 0) {
                if (valueSubH32 != null && valueSubH32 != undefined) {
                  if (valueSubH32[0] != null && valueSubH32[0] != undefined) {
                    if (
                      valueSubH32[0].Value != null &&
                      valueSubH32[0].Value != undefined
                    ) {
                      reverseSubH3After = valueSubH32[0].Value;
                    }
                  }
                }
              }
              // d
              if (valueSubD1.length > 0) {
                if (valueSubD1 != null && valueSubD1 != undefined) {
                  if (valueSubD1[0] != null && valueSubD1[0] != undefined) {
                    if (
                      valueSubD1[0].Value != null &&
                      valueSubD1[0].Value != undefined
                    ) {
                      reverseSubD1Before = valueSubD1[0].Value;
                    }
                  }
                }
              }
              if (valueSubD12.length > 0) {
                if (valueSubD12 != null && valueSubD12 != undefined) {
                  if (valueSubD12[0] != null && valueSubD12[0] != undefined) {
                    if (
                      valueSubD12[0].Value != null &&
                      valueSubD12[0].Value != undefined
                    ) {
                      reverseSubD1After = valueSubD12[0].Value;
                    }
                  }
                }
              }
            }
          }

          obj.Value =
            (forwardCurrentAfter == null ? 0 : forwardCurrentAfter) -
            (reverseCurrentAfter == null ? 0 : reverseCurrentAfter) -
            ((forwardCurrentBefore == null ? 0 : forwardCurrentBefore) -
              (reverseCurrentBefore == null ? 0 : reverseCurrentBefore));

          if (obj.Value < 0) {
            obj.Value = 0;
          }

          obj.Value = obj.Value.toFixed(2);
          let valueForcast = 0;
          let avgH = 0;
          let avgD = 0;

          if (
            (forwardSubH1Before != null || reverseSubH1Before != null) &&
            (forwardSubH1After != null || reverseSubH1After != null) &&
            (forwardSubH2Before != null || reverseSubH2Before != null) &&
            (forwardSubH2After != null || reverseSubH2After != null) &&
            (forwardSubH3Before != null || reverseSubH3Before != null) &&
            (forwardSubH3After != null || reverseSubH3After != null)
          ) {
            let quantityH1 =
              forwardSubH1After -
              reverseSubH1After -
              (forwardSubH1Before - reverseSubH1Before);
            let quantityH2 =
              forwardSubH2After -
              reverseSubH2After -
              (forwardSubH2Before - reverseSubH2Before);
            let quantityH3 =
              forwardSubH3After -
              reverseSubH3After -
              (forwardSubH3Before - reverseSubH3Before);

            avgH = (quantityH1 + quantityH2 + quantityH3) / 3;
          }

          if (
            (forwardSubD1Before != null || reverseSubD1Before != null) &&
            (forwardSubD1After != null || reverseSubD1After != null)
          ) {
            let quantityD1 =
              forwardSubD1After -
              reverseSubD1After -
              (forwardSubD1Before - reverseSubD1Before);

            avgD = quantityD1;
          }

          valueForcast = (avgH + avgD) / 2;

          obj.ForcastValue =
            valueForcast.toFixed(2) < 0 ? 0 : valueForcast.toFixed(2);

          result.push(obj);
        }
      }
    }
  }

  res.json(result);
};
