const mongoose = require("mongoose");
const SiteModel = require("../../model/site");
const ChannelModel = require("../../model/Channel.js");
const UserModel = require("../../model/user");
const ConsumerSiteModel = require("../../model/consumerSite");
const StaffSiteModel = require("../../model/staffSite");

module.exports.GetDataDashBoardVilog = async function (req, res) {
  const userid = req.params.userid;

  let result = [];

  let user = await UserModel.findOne({ Username: userid });

  let listSite;

  if (user.Role == "admin") {
    listSite = await SiteModel.find({});
  } else if (user.Role == "consumer") {
    let listIdSite = await ConsumerSiteModel.find(
      { IdUser: user._id },
      { IdSite: 1, _id: 0 }
    );

    let list = [];

    for (let item of listIdSite) {
      list.push(item.IdSite);
    }

    if (listIdSite.length > 0) {
      listSite = await SiteModel.find({ _id: { $in: list } });
    } else {
      listSite = [];
    }

    //listSite = await SiteModel.find({ ConsumerId: user.ConsumerId });
  } else if (user.Role == "staff") {
    let listIdSite = await StaffSiteModel.find(
      { IdUser: user._id },
      { IdSite: 1, _id: 0 }
    );

    let list = [];

    for (let item of listIdSite) {
      list.push(item.IdSite);
    }

    if (listIdSite.length > 0) {
      listSite = await SiteModel.find({ _id: { $in: list } });
    } else {
      listSite = [];
    }
    //listSite = await SiteModel.find({ StaffId: user.StaffId });
  } else {
    listSite = await SiteModel.find({});
  }

  if (listSite.length > 0) {
    for (let item of listSite) {
      if (
        item.LoggerId != null &&
        item.LoggerId != undefined &&
        item.LoggerId.trim() != ""
      ) {
        let channels = await ChannelModel.find({ LoggerId: item.LoggerId });
        if (channels.length > 0) {
          let channelResult = await GetChannelByLoggerId(item, channels);

          if (channelResult.length > 0) {
            let obj = {};

            obj.SiteId = item.SiteId;
            obj.Location = item.Location;
            obj.BatSolarChannel = "";
            obj.BatLoggerChannel = "";
            obj.BatMetterChannel = "";
            obj.Temp = "";
            obj.Humidity = "";
            obj.Status = null;

            for (let channel of channelResult) {
              if (channel.BatSolarChannel == true) {
                obj.BatSolarChannel = channel.LastValue;
              } else if (channel.BatLoggerChannel == true) {
                obj.BatLoggerChannel = channel.LastValue;
              } else if (channel.BatMetterChannel == true) {
                obj.BatMetterChannel = channel.LastValue;
              } else if (channel.OtherChannel == true) {
                if (channel.ChannelName == "Temp") {
                  obj.Temp = channel.LastValue;
                } else if (channel.ChannelName == "Humidity") {
                  obj.Humidity = channel.LastValue;
                }
              }

              if(channel.Status != null && channel.Status != undefined){
                if(obj.Status == null || obj.Status > channel.Status){
                  obj.Status = channel.Status;
                }
              }
            }

            if(obj.Status == null){
              obj.Status = 10;
            }

            result.push(obj);
          }
        }
      }
    }
  }

  res.json(result);
};

async function GetChannelByLoggerId(site, channels) {
  let nowTime = new Date(Date.now());

  let timeDelay = 60;

  if (site.timeDelay != null && site.timeDelay != undefined) {
    timeDelay = site.timeDelay;
  }

  let result = [];

  for (let channel of channels) {
    let isError = false;
    let status;
    if (isError == false) {
      if (channel.TimeStamp != null) {
        let diff = Math.round(
          (Date.now() - channel.TimeStamp.getTime()) / 1000 / 60
        );
        if (diff > timeDelay) {
          status = 2;
          isError = true;
        }
      }
    }
    if (isError == false) {
      if (channel.BaseMin != null) {
        if (channel.LastValue != null) {
          if (channel.LastValue < channel.BaseMin) {
            status = 4;
            isError = true;
          }
        }
      }
    }
    if (isError == false) {
      if (channel.BaseMax != null) {
        if (channel.LastValue != null) {
          if (channel.LastValue > channel.BaseMax) {
            status = 4;
            isError = true;
          }
        }
      }
    }
    if (isError == false) {
      if (channel.BatSolarChannel == true) {
        if (channel.FromHour != null && channel.ToHour != null) {
          if (nowTime.getHours() >= channel.ToHour) {
            let check = await checkBatSolarNoCharge(
              channel.ChannelId,
              channel.FromHour,
              channel.ToHour
            );
            if (check == true) {
              isError = true;
              status = 5;
            }
          }
        }
      }
    }
    if (isError == false) {
      if (channel.BatSolarChannel == true) {
        if (channel.LastValue != null) {
          if (channel.LastValue < channel.BatThreshold) {
            status = 6;
            isError = true;
          }
        }
      }
    }
    if (isError == false) {
      if (
        channel.BatMetterChannel == true ||
        channel.BatLoggerChannel == true
      ) {
        if (channel.LastValue != null) {
          if (channel.LastValue <= channel.BatThreshold) {
            status = 7;
            isError = true;
          }
        }
      }
    }
    // if (isError == false) {
    //   if (channel.BatSolarChannel == true) {
    //     if (channel.LastValue != null) {
    //       if (channel.FromHour != null && channel.ToHour != null) {
    //         let date = new Date(Date.now());

    //         if (
    //           date.getHours() >= channel.FromHour &&
    //           date.getHours() <= channel.ToHour
    //         ) {
    //           if (channel.LastValue < 13.5) {
    //             status = 7;
    //             isError = true;
    //           }
    //         }
    //       }
    //     }
    //   }
    // }
    if (isError == false) {
      if (channel.BarSolarChannel == true) {
        if (channel.FromHour != null && channel.ToHour != null) {
          if (
            CheckPerformanceSolar(
              channel.ChannelId,
              channel.FromHour,
              channel.ToHour
            ) == true
          ) {
            status = 8;
            isError = true;
          }
        }
      }
    }
    if (isError == false) {
      status = 10;
    }

    let obj = { ...channel._doc };
    obj.Status = status;
    obj.allowChart = true;
    result.push(obj);
  }

  return result;
}

async function CheckPerformanceSolar(channelid, fromHour, toHour) {
  let result = [];
  let check = false;

  let now = new Date(Date.now());
  let end = new Date(Date.now());

  end.setDate(end.getDate() - 7);

  let diffTime = now.getTime() - end.getTime();

  let diffDay = diffTime / (1000 * 3600 * 24);

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

  for (let i = 0; i < diffDay; i++) {
    let tempStart = new Date(end.getTime());
    let tempEnd = new Date(end.getTime());
    tempStart.setDate(tempStart.getDate() + i);
    tempEnd.setDate(tempEnd.getDate() + i);

    tempStart.setHours(fromHour, 0, 0);
    tempEnd.setHours(toHour, 0, 0);

    // get value for this time
    let value = await DataLogger.find({
      TimeStamp: { $gte: tempStart, $lte: tempEnd },
    });

    if (value != null) {
      if (value.length > 0) {
        let total = value.reduce((a, b) => {
          return a + b.Value;
        }, 0);

        let count = value.filter((e) => {
          return e.Value != null && e.Value != undefined;
        });

        let avg = total / count.length;

        result.push(avg);
      }
    }
  }

  if (result.length >= 7) {
    for (let i = 1; i < result.length; i++) {
      if (result[i] >= result[i - 1]) {
        check = false;
        break;
      } else if (result[i] < result[i - 1]) {
        check = true;
      }
    }
  } else {
    check = false;
  }

  return check;
}

async function checkBatSolarNoCharge(channelid, fromHour, toHour) {
  let result = false;

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

  let now = new Date(Date.now());

  let startNow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    fromHour + 7,
    0,
    0
  );
  let endNow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    toHour + 7,
    0,
    0
  );
  let startPrev = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1,
    fromHour + 7,
    0,
    0
  );
  let endPrev = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1,
    toHour + 7,
    0,
    0
  );
  let startMinPrev = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1,
    17 + 7,
    0,
    0
  );
  let endMinPrev = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    7 + 7,
    0,
    0
  );
  let startMin2DayPrev = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 2,
    17 + 7,
    0,
    0
  );
  let endMin2DayPrev = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1,
    7 + 7,
    0,
    0
  );

  let valueNow = await DataLogger.find({
    TimeStamp: { $gte: startNow, $lte: endNow },
  });
  if (valueNow != null) {
    if (valueNow.length > 0) {
      let totalNow = valueNow.reduce((a, b) => {
        return a + b.Value;
      }, 0);

      let count = valueNow.filter((e) => {
        return e.Value != null && e.Value != undefined;
      });

      let avgNow = totalNow / count.length;

      let valuePrev = await DataLogger.find({
        TimeStamp: { $gte: startPrev, $lte: endPrev },
      });

      if (valuePrev != null) {
        if (valuePrev.length > 0) {
          // find min value prev day

          let valueMinPrev = await DataLogger.find({
            TimeStamp: { $gte: startMinPrev, $lte: endMinPrev },
          })
            .sort({ Value: 1 })
            .limit(1);

          let minValuePrev = null;

          if (valueMinPrev.length > 0) {
            if (
              valueMinPrev[0].Value != null &&
              valueMinPrev[0].Value != undefined
            ) {
              minValuePrev = valueMinPrev[0].Value;
            }
          }

          let valueMin2DayPrev = await DataLogger.find({
            TimeStamp: { $gte: startMin2DayPrev, $lte: endMin2DayPrev },
          })
            .sort({ Value: 1 })
            .limit(1);

          let minValue2DayPrev = null;

          if (valueMin2DayPrev.length > 0) {
            if (
              valueMin2DayPrev[0].Value != null &&
              valueMin2DayPrev[0].Value != undefined
            ) {
              minValue2DayPrev = valueMin2DayPrev[0].Value;
            }
          }

          let totalPrev = valuePrev.reduce((a, b) => {
            return a + b.Value;
          }, 0);

          let countPrev = valuePrev.filter((e) => {
            return e.Value != null && e.Value != undefined;
          });

          let avgPrev = totalPrev / countPrev.length;

          if (minValuePrev != null && minValuePrev != undefined) {
            if (minValue2DayPrev != null && minValue2DayPrev != undefined) {
              let calc = avgNow - minValuePrev - (avgPrev - minValue2DayPrev);

              if (calc < -0.3) {
                result = true;
              }
            }
          }
        }
      }
    }
  }

  return result;
}
