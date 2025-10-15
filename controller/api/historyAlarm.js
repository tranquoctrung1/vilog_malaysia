const HistoryAlarm = require('../../model/historyAlarm');
const SiteModel = require('../../model/site');

module.exports.GetHistoryAlarm = async function (req, res) {
    let start = req.params.start;
    let end = req.params.end;

    start = new Date(parseInt(start));
    end = new Date(parseInt(end));

    start.setHours(start.getHours() + 7);
    end.setHours(end.getHours() + 7);

    let result = await HistoryAlarm.find({
        TimeStampAlarm: { $gte: start, $lte: end },
    }).sort({ TimeStampAlarm: -1 });

    res.json(result);
};

module.exports.GetLatestHistoryAlarm = async function (req, res) {
    let result = [];

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

    res.json(result);
};
