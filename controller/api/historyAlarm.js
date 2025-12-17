const HistoryAlarm = require('../../model/historyAlarm');
const SiteModel = require('../../model/site');
const UserModel = require('../../model/user');
const ConsumerSiteModel = require('../../model/consumerSite');
const StaffSiteModel = require('../../model/staffSite');

module.exports.GetHistoryAlarm = async function (req, res) {
    let start = req.params.start;
    let end = req.params.end;
    let username = req.params.username;

    let user = await UserModel.findOne({ Username: username });

    let listSite;

    let result = [];

    start = new Date(parseInt(start));
    end = new Date(parseInt(end));

    start.setHours(start.getHours() + 8);
    end.setHours(end.getHours() + 8);

    if (user.Role == 'admin') {
        result = await HistoryAlarm.find({
            TimeStampAlarm: { $gte: start, $lte: end },
        }).sort({ TimeStampAlarm: -1 });
    } else if (user.Role == 'consumer') {
        let listIdSite = await ConsumerSiteModel.find(
            { IdUser: user._id },
            { IdSite: 1, _id: 0 },
        );

        let list = [];

        for (let item of listIdSite) {
            list.push(item.IdSite);
        }

        if (listIdSite.length > 0) {
            listSite = await SiteModel.find({ _id: { $in: list } }).sort({
                SiteId: 1,
            });
        } else {
            listSite = [];
        }

        let listSiteId = [];
        for (const site of listSite) {
            listSiteId.push(site.SiteId);
        }

        result = await HistoryAlarm.find({
            TimeStampAlarm: { $gte: start, $lte: end },
            SiteId: { $in: listSiteId },
        }).sort({ TimeStampAlarm: -1 });
    } else if (user.Role == 'staff') {
        let listIdSite = await StaffSiteModel.find(
            { IdUser: user._id },
            { IdSite: 1, _id: 0 },
        );

        let list = [];

        for (let item of listIdSite) {
            list.push(item.IdSite);
        }

        if (listIdSite.length > 0) {
            listSite = await SiteModel.find({ _id: { $in: list } }).sort({
                SiteId: 1,
            });
        } else {
            listSite = [];
        }

        let listSiteId = [];
        for (const site of listSite) {
            listSiteId.push(site.SiteId);
        }

        result = await HistoryAlarm.find({
            TimeStampAlarm: { $gte: start, $lte: end },
            SiteId: { $in: listSiteId },
        }).sort({ TimeStampAlarm: -1 });
    } else {
        result = await HistoryAlarm.find({
            TimeStampAlarm: { $gte: start, $lte: end },
        }).sort({ TimeStampAlarm: -1 });
    }

    res.json(result);
};

module.exports.GetLatestHistoryAlarm = async function (req, res) {
    let username = req.params.username;
    let result = [];

    let user = await UserModel.findOne({ Username: username });

    if (user.Role == 'admin') {
        const sites = await SiteModel.find({}).sort({ Location: 1 });

        for (const item of sites) {
            const alarm = await HistoryAlarm.findOne({
                SiteId: item.SiteId,
            })
                .sort({ TimeStampAlarm: -1 })
                .limit(1);

            if (alarm !== null) {
                result.push(alarm);
            }
        }
    } else if (user.Role == 'consumer') {
        let listIdSite = await ConsumerSiteModel.find(
            { IdUser: user._id },
            { IdSite: 1, _id: 0 },
        );

        let list = [];

        for (let item of listIdSite) {
            list.push(item.IdSite);
        }

        let listSite = [];

        if (listIdSite.length > 0) {
            listSite = await SiteModel.find({ _id: { $in: list } }).sort({
                SiteId: 1,
            });
        } else {
            listSite = [];
        }

        for (const item of listSite) {
            const alarm = await HistoryAlarm.findOne({
                SiteId: item.SiteId,
            })
                .sort({ TimeStampAlarm: -1 })
                .limit(1);

            if (alarm !== null) {
                result.push(alarm);
            }
        }
    } else if (user.Role == 'staff') {
        let listIdSite = await StaffSiteModel.find(
            { IdUser: user._id },
            { IdSite: 1, _id: 0 },
        );

        let list = [];

        for (let item of listIdSite) {
            list.push(item.IdSite);
        }

        let listSite = [];

        if (listIdSite.length > 0) {
            listSite = await SiteModel.find({ _id: { $in: list } }).sort({
                SiteId: 1,
            });
        } else {
            listSite = [];
        }

        for (const item of listSite) {
            const alarm = await HistoryAlarm.findOne({
                SiteId: item.SiteId,
            })
                .sort({ TimeStampAlarm: -1 })
                .limit(1);

            if (alarm !== null) {
                result.push(alarm);
            }
        }
    } else {
        const sites = await SiteModel.find({}).sort({ Location: 1 });

        for (const item of sites) {
            const alarm = await HistoryAlarm.findOne({
                SiteId: item.SiteId,
            })
                .sort({ TimeStampAlarm: -1 })
                .limit(1);

            if (alarm !== null) {
                result.push(alarm);
            }
        }
    }

    res.json(result);
};
