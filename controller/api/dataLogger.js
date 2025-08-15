const mongoose = require('mongoose');
const ChannelModel = require('../../model/Channel');
const SiteModel = require('../../model/site');

module.exports.GetDataLoggerByTimeStampSWOC = async function (req, res) {
    const { channelid, start, end } = req.query;

    let startDate = new Date(parseInt(start));
    let endDate = new Date(parseInt(end));

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

    const result = [];

    const data = await DataLogger.find({
        TimeStamp: { $gte: startDate, $lte: endDate },
    }).sort({ TimeStamp: 1 });

    for (const item of data) {
        const obj = {};
        obj.Value = item.Value;
        obj.TimeStamp = item.TimeStamp;

        result.push(obj);
    }

    res.status(200).json(result);
};

module.exports.GetDataLoggerWithTime = async function (req, res) {
    const channelid = req.params.channelid;
    const start = req.params.start;
    const end = req.params.end;
    const desc = req.params.desc;

    let startDate = new Date(parseInt(start));
    let endDate = new Date(parseInt(end));

    let DataLoggerSchema = new mongoose.Schema({
        TimeStamp: Date,
        Value: Number,
    });

    delete mongoose.models.DataLogger;

    let DataLogger = mongoose.model(
        'DataLogger',
        DataLoggerSchema,
        't_Data_Logger_' + channelid,
    );

    let loggerid = channelid.split('_')[0];

    let channels = await ChannelModel.find({ LoggerId: loggerid });
    let sites = await SiteModel.find({ LoggerId: loggerid });

    let channelForward = '';
    let channelNetIndex = '';
    let channelBatteryMeter = '';
    let channelBatteryLogger = '';

    if (sites.length > 0) {
        if (channels.length > 0) {
            channelForward = channels.find((el) => el.ForwardFlow === true);
            channelBatteryLogger = channels.find(
                (el) => el.BatLoggerChannel === true,
            );
            channelBatteryMeter = channels.find(
                (el) => el.BatMetterChannel === true,
            );
        }
        if (sites[0].TypeMeter === 'SU') {
            channelNetIndex = `${loggerid}_108`;
        } else if (sites[0].TypeMeter === 'Kronhe') {
            channelNetIndex = `${loggerid}_100`;
        }
    }

    // query
    let obj = {};
    obj.DataLogger = [];
    obj.MinFlow = 0;
    obj.MaxFlow = 0;
    obj.MinNet = 0;
    obj.MaxNet = 0;
    obj.Consumption = 0;

    if (desc == 1) {
        obj.DataLogger = await DataLogger.find({
            TimeStamp: { $gte: startDate, $lte: endDate },
        }).sort({ TimeStamp: -1 });
    } else {
        obj.DataLogger = await DataLogger.find({
            TimeStamp: { $gte: startDate, $lte: endDate },
        }).sort({ TimeStamp: 1 });
    }

    if (channelForward !== undefined) {
        delete mongoose.models.DataLogger;

        DataLogger = mongoose.model(
            'DataLogger',
            DataLoggerSchema,
            't_Data_Logger_' + channelForward.ChannelId,
        );

        let temp = await DataLogger.find({
            TimeStamp: { $gte: startDate, $lte: endDate },
        }).sort({ Value: -1 });

        if (temp.length > 0) {
            obj.MaxFlow = temp[0].Value;
            obj.MinFlow = temp[temp.length - 1].Value;
        }
    }
    if (channelNetIndex !== '') {
        delete mongoose.models.DataLogger;

        DataLogger = mongoose.model(
            'DataLogger',
            DataLoggerSchema,
            't_Data_Logger_' + channelNetIndex,
        );

        let temp = await DataLogger.find({
            TimeStamp: { $gte: startDate, $lte: endDate },
        }).sort({ Value: -1 });

        if (temp.length > 0) {
            obj.MaxNet = temp[0].Value;
            obj.MinNet = temp[temp.length - 1].Value;
            obj.Consumption = obj.MaxNet - obj.MinNet;
        }
    }

    if (channelBatteryLogger !== undefined) {
        delete mongoose.models.DataLogger;

        DataLogger = mongoose.model(
            'DataLogger',
            DataLoggerSchema,
            't_Data_Logger_' + channelBatteryLogger.ChannelId,
        );

        let temp = await DataLogger.find({
            TimeStamp: { $gte: startDate, $lte: endDate },
        }).sort({ Value: -1 });

        if (temp.length > 0) {
            obj.MaxBatteryLogger = temp[0].Value;
            obj.MinBatteryLogger = temp[temp.length - 1].Value;
        }
    }

    if (channelBatteryMeter !== undefined) {
        delete mongoose.models.DataLogger;

        DataLogger = mongoose.model(
            'DataLogger',
            DataLoggerSchema,
            't_Data_Logger_' + channelBatteryMeter.ChannelId,
        );

        let temp = await DataLogger.find({
            TimeStamp: { $gte: startDate, $lte: endDate },
        }).sort({ Value: -1 });

        if (temp.length > 0) {
            obj.MaxBatteryMeter = temp[0].Value;
            obj.MinBatteryMeter = temp[temp.length - 1].Value;
        }
    }

    res.json(obj);
};

module.exports.GetCurrentTimeStamp = async function (req, res) {
    let channelid = req.params.channelid;

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

    // query

    let result = await DataLogger.find().sort({ TimeStamp: -1 }).limit(1);

    res.json(result);
};

module.exports.GetBeginTimeStamp = async function (req, res) {
    let channelid = req.params.channelid;

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

    // query

    let result = await DataLogger.find().sort({ TimeStamp: 1 }).limit(1);

    res.json(result);
};
