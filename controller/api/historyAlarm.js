const HistoryAlarm = require('../../model/historyAlarm');
const SiteModel = require('../../model/site');
const UserModel = require('../../model/user');
const { getPermittedSiteIds } = require('../../helper/sitePermission');

module.exports.GetHistoryAlarm = async function (req, res) {
    let start = req.params.start;
    let end = req.params.end;
    let username = req.params.username;

    let user = await UserModel.findOne({ Username: username });

    let result = [];

    start = new Date(parseInt(start));
    end = new Date(parseInt(end));

    start.setHours(start.getHours() + 8);
    end.setHours(end.getHours() + 8);

    const permittedIds = await getPermittedSiteIds(user);

    if (permittedIds === null) {
        result = await HistoryAlarm.find({
            TimeStampAlarm: { $gte: start, $lte: end },
        }).sort({ TimeStampAlarm: -1 }).lean();
    } else {
        let listSite = [];
        if (permittedIds.length > 0) {
            listSite = await SiteModel.find({
                _id: { $in: permittedIds },
            }).sort({ SiteId: 1 });
        }

        let listSiteId = [];
        for (const site of listSite) {
            listSiteId.push(site.SiteId);
        }

        result = await HistoryAlarm.find({
            TimeStampAlarm: { $gte: start, $lte: end },
            SiteId: { $in: listSiteId },
        }).sort({ TimeStampAlarm: -1 }).lean();
    }

    res.json(result);
};

module.exports.GetLatestHistoryAlarm = async function (req, res) {
    let username = req.params.username;
    let result = [];

    let user = await UserModel.findOne({ Username: username });

    const permittedIds = await getPermittedSiteIds(user);

    let listSite;
    if (permittedIds === null) {
        listSite = await SiteModel.find({}).sort({ Location: 1 });
    } else if (permittedIds.length > 0) {
        listSite = await SiteModel.find({ _id: { $in: permittedIds } }).sort({
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

    res.json(result);
};
