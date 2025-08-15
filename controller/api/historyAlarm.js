const HistoryAlarm = require('../../model/historyAlarm');

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