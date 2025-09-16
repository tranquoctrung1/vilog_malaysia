const ChannelModel = require('../../model/Channel.js');
const SiteModel = require('../../model/site');
const mongoose = require('mongoose');

module.exports.GetChannelConfigSWOC = async function (req, res) {
    const result = [];

    const data = await ChannelModel.find({}).sort({ ChannelId: 1 });

    for (const item of data) {
        const obj = {};
        obj.LoggerId = item.LoggerId;
        obj.channelId = item.ChannelId;
        obj.Name = item.ChannelName;
        obj.Meansure = item.Unit;
        obj.HHAlarmCfg = item.BaseMax;
        obj.HAlarmCfg = null;
        obj.LLAlarmCfg = item.BaseMin;
        obj.LAlarmCfg = null;

        result.push(obj);
    }

    res.status(200).json(result);
};

module.exports.GetLastDataChannelConfigSWOC = async function (req, res) {
    const result = [];

    const data = await ChannelModel.find({}).sort({ ChannelId: 1 });

    for (const item of data) {
        const obj = {};
        obj.LoggerId = item.LoggerId;
        obj.channelId = item.ChannelId;
        obj.LastValue = item.LastValue;
        obj.TimeStamp = item.TimeStamp;

        result.push(obj);
    }

    res.status(200).json(result);
};

module.exports.GetChannelByLoggerId = async function (req, res) {
    const loggerid = req.params.loggerid;

    let site = await SiteModel.find({ LoggerId: loggerid });

    let nowTime = new Date(Date.now());

    let timeDelay = 60;

    if (site.length > 0) {
        if (
            site[0].TimeDelay != 'null' &&
            site[0].TimeDelay != null &&
            site[0].timeDelay != undefined
        ) {
            timeDelay = site[0].TimeDelay;
        }
    }

    let currentQuantityForward = 0;
    let currentQuantityReverse = 0;
    let zeroQuantityForward = 0;
    let zeroQuantityReverse = 0;

    let channelForward = '';
    let channelReverse = '';
    let commonDate = null;

    let channels = await ChannelModel.find({ LoggerId: loggerid }).sort({
        ChannelName: 1,
    });

    let result = [];

    for (let channel of channels) {
        let isError = false;
        let status;
        if (isError == false) {
            if (channel.TimeStamp != null) {
                let diff = Math.round(
                    (Date.now() - channel.TimeStamp.getTime()) / 1000 / 60,
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
        // if (isError == false) {
        //     if (channel.BatSolarChannel == true) {
        //         if (channel.FromHour != null && channel.ToHour != null) {
        //             if (nowTime.getHours() >= channel.ToHour) {
        //                 let check = await checkBatSolarNoCharge(
        //                     channel.ChannelId,
        //                     channel.FromHour,
        //                     channel.ToHour,
        //                 );
        //                 if (check == true) {
        //                     isError = true;
        //                     status = 9;
        //                 }
        //             }
        //         }
        //     }
        // }
        // if (isError == false) {
        //     if (channel.BatSolarChannel == true) {
        //         if (channel.LastValue != null) {
        //             if (channel.LastValue < channel.BatThreshold) {
        //                 status = 5;
        //                 isError = true;
        //             }
        //         }
        //     }
        // }
        // if (isError == false) {
        //     if (
        //         channel.BatMetterChannel == true ||
        //         channel.BatLoggerChannel == true
        //     ) {
        //         if (channel.LastValue != null) {
        //             if (channel.LastValue <= channel.BatThreshold) {
        //                 status = 6;
        //                 isError = true;
        //             }
        //         }
        //     }
        // }
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
        // if (isError == false) {
        //     if (channel.BarSolarChannel == true) {
        //         if (channel.FromHour != null && channel.ToHour != null) {
        //             if (nowTime.getHours() >= 9) {
        //                 if (
        //                     CheckPerformanceWithMinValue(channel.ChanelId) ==
        //                     true
        //                 ) {
        //                     status = 8;
        //                     isError = true;
        //                 }
        //             }
        //             if (nowTime.getHours >= channel.ToHour) {
        //                 if (
        //                     CheckPerformanceSolar(
        //                         channel.ChannelId,
        //                         channel.FromHour,
        //                         channel.ToHour,
        //                     ) == true
        //                 ) {
        //                     status = 8;
        //                     isError = true;
        //                 }
        //             }
        //         }
        //     }
        // }
        if (isError == false) {
            status = 1;
        }

        if (channel.ForwardFlow == true) {
            channelForward = channel.ChannelId;
            if (channel.IndexTimeStamp != null) {
                commonDate = new Date(channel.IndexTimeStamp);
            }
            if (channel.LastIndex != null) {
                currentQuantityForward = channel.LastIndex;
            }
        } else if (channel.ReverseFlow == true) {
            channelReverse = channel.ChannelId;
            if (commonDate == null) {
                if (channel.IndexTimeStamp != null) {
                    commonDate = new Date(channel.IndexTimeStamp);
                }
            }
            if (channel.LastIndex != null) {
                currentQuantityReverse = channel.LastIndex;
            }
        }

        let obj = { ...channel._doc };
        obj.Status = status;
        obj.allowChart = true;
        result.push(obj);
    }

    if (site.length > 0) {
        let quantity = 0;

        let objChannelQuantity = {};
        objChannelQuantity.ChannelId = site[0].LoggerId + '_102';
        objChannelQuantity.ChannelName = 'SLN';
        objChannelQuantity.LoggerId = site[0].LoggerId;
        objChannelQuantity.Unit = 'm3/h';
        objChannelQuantity.Pressure1 = false;
        objChannelQuantity.Pressure2 = false;
        objChannelQuantity.ForwardFlow = false;
        objChannelQuantity.ReverseFlow = false;
        objChannelQuantity.IndexTimeStamp = null;
        objChannelQuantity.LastIndex = 0;
        objChannelQuantity.BaseLine = null;
        objChannelQuantity.BaseMin = null;
        objChannelQuantity.BaseMax = null;
        objChannelQuantity.OtherChannel = true;
        objChannelQuantity.DisplayOnLabel = true;
        objChannelQuantity.Status = null;
        objChannelQuantity.allowChart = false;

        if (commonDate != null) {
            let zeroHour = new Date(
                commonDate.getFullYear(),
                commonDate.getMonth(),
                commonDate.getDate(),
                0,
                0,
                0,
            );
            let oneHour = new Date(
                commonDate.getFullYear(),
                commonDate.getMonth(),
                commonDate.getDate(),
                1,
                0,
                0,
            );

            if (channelForward != '') {
                const DataLoggerSchema = new mongoose.Schema({
                    TimeStamp: Date,
                    Value: Number,
                });

                delete mongoose.models.DataLogger;

                const DataLogger = mongoose.model(
                    'DataLogger',
                    DataLoggerSchema,
                    't_Index_Logger_' + channelForward,
                );

                let value = await DataLogger.find({
                    TimeStamp: { $gte: zeroHour, $lt: oneHour },
                })
                    .sort({ TimeStamp: 1 })
                    .limit(1);

                if (value.length > 0) {
                    if (value[0].Value != null) {
                        zeroQuantityForward = value[0].Value;
                    }
                }
            }

            if (channelReverse != '') {
                const DataLoggerSchema = new mongoose.Schema({
                    TimeStamp: Date,
                    Value: Number,
                });

                delete mongoose.models.DataLogger;

                const DataLogger = mongoose.model(
                    'DataLogger',
                    DataLoggerSchema,
                    't_Index_Logger_' + channelReverse,
                );

                let value = await DataLogger.find({
                    TimeStamp: { $gte: zeroHour, $lt: oneHour },
                })
                    .sort({ TimeStamp: 1 })
                    .limit(1);

                if (value.length > 0) {
                    if (value[0].Value != null) {
                        zeroQuantityReverse = value[0].Value;
                    }
                }
            }

            quantity =
                currentQuantityForward -
                currentQuantityReverse -
                (zeroQuantityForward - zeroQuantityReverse);
            if (quantity < 0) {
                quantity = 0;
            }

            objChannelQuantity.LastValue = quantity.toFixed(2);
            objChannelQuantity.TimeStamp = commonDate;

            //result.push(objChannelQuantity);
        }
    }

    res.json(result);
};

module.exports.GetAllChannel = async function (req, res) {
    let loggerid = req.params.loggerid;
    res.json(await ChannelModel.find({ LoggerId: loggerid }));
};

module.exports.GetChannelByChannelId = async function (req, res) {
    let channelid = req.params.channelid;

    let result = await ChannelModel.find({ ChannelId: channelid });

    res.json(result);
};

module.exports.InsertChannelConfig = async function (req, res) {
    const data = req.body;
    data.BaseLine = data.BaseLine !== 'null' ? data.BaseLine : null;
    data.BaseMax = data.BaseMax !== 'null' ? data.BaseMax : null;
    data.BaseMin = data.BaseMin !== 'null' ? data.BaseMin : null;
    data.BatThreshold = data.BatThreshold !== 'null' ? data.BatThreshold : null;
    data.FromHour = data.FromHour !== 'null' ? data.FromHour : null;
    data.ToHour = data.ToHour !== 'null' ? data.ToHour : null;

    let check = await ChannelModel.find({ ChannelId: data.ChannelId });

    if (check.length == 0) {
        let result = await ChannelModel.insertMany([data]);

        if (result.length > 0) {
            const DataLoggerSchema = new mongoose.Schema({
                TimeStamp: Date,
                Value: Number,
            });

            DataLoggerSchema.index({ TimeStamp: 1 });

            delete mongoose.models.DataLogger;

            const DataLogger = mongoose.model(
                'DataLogger',
                DataLoggerSchema,
                't_Data_Logger_' + data.ChannelId,
            );

            await DataLogger.createCollection();

            const DataLoggerSchema2 = new mongoose.Schema({
                TimeStamp: Date,
                Value: Number,
            });

            DataLoggerSchema2.index({ TimeStamp: 1 });

            delete mongoose.models.DataLogger2;

            const DataLogger2 = mongoose.model(
                'DataLogger2',
                DataLoggerSchema2,
                't_Index_Logger_' + data.ChannelId,
            );

            await DataLogger2.createCollection();

            res.json(result[0]._id);
        } else {
            res.json(0);
        }
    } else {
        res.json(0);
    }
};

module.exports.UpdateChannelConfig = async function (req, res) {
    const data = req.body;
    data.BaseLine = data.BaseLine !== 'null' ? data.BaseLine : null;
    data.BaseMax = data.BaseMax !== 'null' ? data.BaseMax : null;
    data.BaseMin = data.BaseMin !== 'null' ? data.BaseMin : null;
    data.BatThreshold = data.BatThreshold !== 'null' ? data.BatThreshold : null;
    data.FromHour = data.FromHour !== 'null' ? data.FromHour : null;
    data.ToHour = data.ToHour !== 'null' ? data.ToHour : null;
    let result = await ChannelModel.updateOne(
        { _id: data.id },
        {
            ChannelId: data.ChannelId,
            LoggerId: data.LoggerId,
            ChannelName: data.ChannelName,
            Unit: data.Unit,
            Pressure1: data.Pressure1,
            Pressure2: data.Pressure2,
            ForwardFlow: data.ForwardFlow,
            ReverseFlow: data.ReverseFlow,
            BaseLine: data.BaseLine,
            BaseMax: data.BaseMax,
            BaseMin: data.BaseMin,
            OtherChannel: data.OtherChannel,
            BatSolarChannel: data.BatSolarChannel,
            BatLoggerChannel: data.BatLoggerChannel,
            BatMetterChannel: data.BatMetterChannel,
            BatThreshold: data.BatThreshold,
            FromHour: data.FromHour,
            ToHour: data.ToHour,
        },
    );

    res.json(result.nModified);
};

module.exports.DeleteChannelConfig = async function (req, res) {
    const id = req.body.id;
    const channelid = req.body.ChannelId;

    let result = await ChannelModel.deleteOne({
        _id: id,
    });

    const DataLoggerSchema = new mongoose.Schema({
        TimeStamp: Date,
        Value: Number,
    });

    if (channelid != 'null') {
        mongoose.connection.db.dropCollection(
            't_Data_Logger_' + channelid,
            function (err, result) {
                if (err) {
                    console.log(err);
                } else {
                    console.log(result);
                }
            },
        );
        mongoose.connection.db.dropCollection(
            't_Index_Logger_' + channelid,
            function (err, result) {
                if (err) {
                    console.log(err);
                } else {
                    console.log(result);
                }
            },
        );
    }

    res.json(result.deletedCount);
};

module.exports.GetChannelCard = async function (req, res) {
    let siteid = req.params.siteid;
    let start = req.params.start;
    let end = req.params.end;

    let startDate = new Date(parseInt(start));
    let endDate = new Date(parseInt(end));

    let result = [];

    let site = await SiteModel.find({ SiteId: siteid });

    if (site.length > 0) {
        let channels = await ChannelModel.find({ LoggerId: site[0].LoggerId });

        for (let channel of channels) {
            let obj = {};
            obj.ChannelName = channel.ChannelName || null;
            obj.ChannelId = channel.ChannelId || null;
            obj.Unit = channel.Unit || null;
            obj.TimeStamp = channel.TimeStamp || null;
            obj.LastValue = channel.LastValue || null;

            const DataLoggerSchema = new mongoose.Schema({
                TimeStamp: Date,
                Value: Number,
            });

            delete mongoose.models.DataLogger;

            const DataLogger = mongoose.model(
                'DataLogger',
                DataLoggerSchema,
                't_Data_Logger_' + channel.ChannelId,
            );

            // get value for this time
            let minValue = await DataLogger.find({
                TimeStamp: { $gte: startDate, $lte: endDate },
            })
                .sort({ Value: 1 })
                .limit(1);

            let maxValue = await DataLogger.find({
                TimeStamp: { $gte: startDate, $lte: endDate },
            })
                .sort({ Value: -1 })
                .limit(1);

            if (maxValue.length > 0) {
                obj.MaxValue = maxValue[0].Value;
            } else {
                obj.MaxValue = null;
            }
            if (minValue.length > 0) {
                obj.MinValue = minValue[0].Value;
            } else {
                obj.MinValue = null;
            }

            result.push(obj);
        }
    }
    res.json(result);
};

module.exports.GetChannelBySiteId = async function (req, res) {
    let siteid = req.params.siteid;

    let site = await SiteModel.find({ SiteId: siteid });

    if (site.length > 0) {
        let channels = await ChannelModel.find({ LoggerId: site[0].LoggerId });

        res.json(channels);
    }
    res.json([]);
};

module.exports.GetCurrentTimeStampBySiteId = async function (req, res) {
    let siteid = req.params.siteid;

    let site = await SiteModel.find({ SiteId: siteid });

    if (site.length > 0) {
        let channels = await ChannelModel.find({ LoggerId: site[0].LoggerId });

        for (let channel of channels) {
            const DataLoggerSchema = new mongoose.Schema({
                TimeStamp: Date,
                Value: Number,
            });

            delete mongoose.models.DataLogger;

            const DataLogger = mongoose.model(
                'DataLogger',
                DataLoggerSchema,
                't_Data_Logger_' + channel.ChannelId,
            );

            // query

            let result = await DataLogger.find()
                .sort({ TimeStamp: -1 })
                .limit(1);
            if (result.length > 0) {
                result[0].TimeStamp.setHours(
                    result[0].TimeStamp.getHours() - 7,
                );
                res.json(result);
                break;
            }
        }
    }
    res.json([]);
};

module.exports.CheckPerformanceSolarTest = async function (req, res) {
    let channelid = req.params.channelid;
    let fromHour = req.params.fromHour;
    let toHour = req.params.toHour;

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
        'DataLogger',
        DataLoggerSchema,
        't_Data_Logger_' + channelid,
    );

    for (let i = 0; i < diffDay; i++) {
        let tempStart = new Date(end.getTime());
        let tempEnd = new Date(end.getTime());
        tempStart.setDate(tempStart.getDate() + i + 1);
        tempEnd.setDate(tempEnd.getDate() + i + 1);

        tempStart.setHours(fromHour, 0, 0, 0);
        tempEnd.setHours(toHour, 0, 0, 0);

        tempStart.setHours(tempStart.getHours() + 7);
        tempEnd.setHours(tempEnd.getHours() + 7);

        console.log(tempStart);
        console.log(tempEnd);

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

    res.json(result);
};

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
        'DataLogger',
        DataLoggerSchema,
        't_Data_Logger_' + channelid,
    );

    for (let i = 0; i < diffDay; i++) {
        let tempStart = new Date(end.getTime());
        let tempEnd = new Date(end.getTime());
        tempStart.setDate(tempStart.getDate() + i + 1);
        tempEnd.setDate(tempEnd.getDate() + i + 1);

        tempStart.setHours(fromHour, 0, 0, 0);
        tempEnd.setHours(toHour, 0, 0, 0);

        tempStart.setHours(tempStart.getHours() + 7);
        tempEnd.setHours(tempEnd.getHours() + 7);

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
        'DataLogger',
        DataLoggerSchema,
        't_Data_Logger_' + channelid,
    );

    let now = new Date(Date.now());

    let startNow = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        fromHour + 7,
        0,
        0,
    );
    let endNow = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        toHour + 7,
        0,
        0,
    );
    let startPrev = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 1,
        fromHour + 7,
        0,
        0,
    );
    let endPrev = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 1,
        toHour + 7,
        0,
        0,
    );
    let startMinPrev = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 1,
        17 + 7,
        0,
        0,
    );
    let endMinPrev = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        7 + 7,
        0,
        0,
    );
    let startMin2DayPrev = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 2,
        17 + 7,
        0,
        0,
    );
    let endMin2DayPrev = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 1,
        7 + 7,
        0,
        0,
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
                        TimeStamp: {
                            $gte: startMin2DayPrev,
                            $lte: endMin2DayPrev,
                        },
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
                        if (
                            minValue2DayPrev != null &&
                            minValue2DayPrev != undefined
                        ) {
                            let calc =
                                avgNow -
                                minValuePrev -
                                (avgPrev - minValue2DayPrev);

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

module.exports.CheckPerformanceWithMinValueTest = async function (req, res) {
    let channelid = req.params.channelid;

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
        'DataLogger',
        DataLoggerSchema,
        't_Data_Logger_' + channelid,
    );

    for (let i = 0; i < diffDay; i++) {
        let tempStart = new Date(end.getTime());
        let tempEnd = new Date(end.getTime());

        tempStart.setDate(tempStart.getDate() + i);
        tempEnd.setDate(tempEnd.getDate() + i + 1);

        tempStart.setHours(17 + 7, 0, 0, 0);
        tempEnd.setHours(9 + 7, 0, 0, 0);

        console.log(tempStart);
        console.log(tempEnd);

        let value = await DataLogger.find({
            TimeStamp: { $gte: tempStart, $lte: tempEnd },
        })
            .sort({ Value: 1 })
            .limit(1);

        if (value.length > 0) {
            if (value[0].Value != null && value[0].Value != undefined) {
                result.push(value[0].Value);
            }
        }
    }

    if (result.length >= 7) {
        for (let i = 1; i < result.length; i++) {
            if (result[i - 1] <= result[i]) {
                check = false;
                break;
            } else {
                check = true;
            }
        }
    } else {
        check = false;
    }

    res.json(check);
};

async function CheckPerformanceWithMinValue(channelid) {
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
        'DataLogger',
        DataLoggerSchema,
        't_Data_Logger_' + channelid,
    );

    for (let i = 0; i < diffDay; i++) {
        let tempStart = new Date(end.getTime());
        let tempEnd = new Date(end.getTime());

        tempStart.setDate(tempStart.getDate() + i);
        tempEnd.setDate(tempEnd.getDate() + i + 1);

        tempStart.setHours(17 + 7, 0, 0);
        tempEnd.setHours(9 + 7, 0, 0);

        let value = await DataLogger.find({
            TimeStamp: { $gte: tempStart, $lte: tempEnd },
        })
            .sort({ Value: 1 })
            .limit(1);

        if (value.length > 0) {
            if (value[0].Value != null && value[0].Value != undefined) {
                result.push(value[0].Value);
            }
        }
    }

    if (result.length >= 7) {
        for (let i = 1; i < result.length; i++) {
            if (result[i - 1] <= result[i]) {
                check = false;
                break;
            } else {
                check = true;
            }
        }
    } else {
        check = false;
    }

    return check;
}

module.exports.GetChannelsSWOC = async function (req, res) {
    res.json(await ChannelModel.find({}));
};
