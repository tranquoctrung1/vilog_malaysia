const mongoose = require('mongoose');
const SiteModel = require('../../model/site');
const ChannelModel = require('../../model/Channel.js');
const UserModel = require('../../model/user');
const ConsumerSiteModel = require('../../model/consumerSite');
const StaffSiteModel = require('../../model/staffSite');

module.exports.GetDataLoggerAVG3DayVACC = async function (req, res) {
    const userid = req.params.userid;
	const type = req.params.type;

	// type 1 is bat solar channel 
	// type 2 is bat logger channel
	// type 3 is bat metter channel

    let result = [];

    let user = await UserModel.findOne({ Username: userid });

    let listSite;

    if (user.Role == 'admin') {
        listSite = await SiteModel.find({});
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
            listSite = await SiteModel.find({ _id: { $in: list } });
        } else {
            listSite = [];
        }

        //listSite = await SiteModel.find({ ConsumerId: user.ConsumerId });
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
            listSite = await SiteModel.find({ _id: { $in: list } });
        } else {
            listSite = [];
        }
        //listSite = await SiteModel.find({ StaffId: user.StaffId });
    } else {
        listSite = await SiteModel.find({});
    }

	
    if (listSite.length > 0) {
		for(let site of listSite)
		{
			if(site.LoggerId != null && site.LoggerId != undefined && site.LoggerId.trim() != "")
			{
				let obj = {};
				let timeDelay = 60;

				if(site.timeDelay != null && site.timeDelay)
				{
					timeDelay = site.timeDelay;
				}

				let channels = await ChannelModel.find({LoggerId: site.LoggerId});
				
				if(channels.length > 0)
				{
					let channelid = "";
					let location = site.Location;
					let timestamp = null;
					let status = 0;
					let currentDay = 0;
					let prevDay = 0;
					let prev2Day = 0;
					let basemin = 0;
					let basemax = 0;
					for(let channel of channels)
					{
						if(type == 1)
						{
							if(channel.BatSolarChannel == true)
							{
								channelid = channel.ChannelId;
								if(channel.TimeStamp != null && channel.TimeStamp != undefined)
								{
									timestamp = channel.TimeStamp;
								}
								basemin = 11.5;
								basemax = 14.5;
								break;
							}
						}
						else if(type == 2)
						{
							if(channel.BatLoggerChannel == true)
							{
								channelid = channel.ChannelId;
								if(channel.TimeStamp != null && channel.TimeStamp != undefined)
								{
									timestamp = channel.TimeStamp;
								}
								basemin = 0.5;
								break;
	
							}
						}
						else if(type == 3)
						{
							if(channel.BatMetterChannel == true)
							{
								channelid = channel.ChannelId;
								if(channel.TimeStamp != null && channel.TimeStamp != undefined)
								{
									timestamp = channel.TimeStamp;
								}	
								basemin = 0.5;
								break;
	
							}
						}
					}

					if(channelid != "")
					{
						let resultAvg =  await CalcAVG3Day(channelid);

						if(timestamp != null && timestamp != undefined)
						{

							let diff = Math.round(
								(Date.now() - timestamp.getTime()) / 1000 / 60
							);

							if(diff > timeDelay)
							{
								status = 1;
							}

							timestamp.setHours(timestamp.getHours() - 7);
						}

						if(resultAvg.length > 0)
						{
							if(resultAvg[0] != null && resultAvg[0] != undefined)
							{
								currentDay = resultAvg[0];
							}
							if(resultAvg[1] != null && resultAvg[1] != undefined)
							{
								prevDay = resultAvg[1];
							}
							if(resultAvg[2] != null && resultAvg[2] != undefined)
							{
								prev2Day = resultAvg[2];
							}
						}

						obj.location = `${location} | ${timestamp.getFullYear()}-${timestamp.getMonth() + 1}-${timestamp.getDate()} ${timestamp.getHours()}:${timestamp.getMinutes()}:${timestamp.getSeconds()}`;
						obj.status = status;
						obj.currentDay = currentDay.toFixed(2);
						obj.prevDay = prevDay.toFixed(2);
						obj.prev2Day = prev2Day.toFixed(2);
						obj.basemin = basemin;
						obj.basemax = basemax;

						result.push(obj);
					}
				}
			}
		}
    }

	res.json(result)
};


async function CalcAVG3Day(channelid) {
	let result = [];

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
	
	let valueTime = await DataLogger.find().sort({ TimeStamp: -1 }).limit(1);
	let currentTimeStamp = null;

	if(valueTime.length > 0)
	{
		if(valueTime[0].TimeStamp != null && valueTime[0].TimeStamp != undefined)	
		{
			currentTimeStamp = valueTime[0].TimeStamp;
		}
	}
	

	if(currentTimeStamp != null)
	{
		let end = new Date(currentTimeStamp);
		let start = new Date(currentTimeStamp);
		start.setMinutes(end.getMinutes() - 30);

		let endPrevDay = new Date(currentTimeStamp);
		endPrevDay.setDate(endPrevDay.getDate() - 1);
		let startPrevDay = new Date(currentTimeStamp);
		startPrevDay.setDate(startPrevDay.getDate() - 1);
		startPrevDay.setMinutes(startPrevDay.getMinutes() - 30);

		let endPrev2Day = new Date(currentTimeStamp);
		endPrev2Day.setDate(endPrev2Day.getDate() - 2);
		let startPrev2Day = new Date(currentTimeStamp);
		startPrev2Day.setDate(startPrev2Day.getDate() - 2);
		startPrev2Day.setMinutes(startPrev2Day.getMinutes() - 30);

		let value = await DataLogger.find({ TimeStamp: { $gte: start, $lte: end } });

		if(value.length > 0)
		{
			let total = value.reduce((a, b) => {
				return a + b.Value;
			}, 0);
	
			let count = value.filter((e) => {
				return e.Value != null && e.Value != undefined;
			});
	
			let avg = total / count.length;

			result.push(avg);
		}

		let valuePrevDay = await DataLogger.find({ TimeStamp: { $gte: startPrevDay, $lte: endPrevDay } });

		if(valuePrevDay.length > 0)
		{
			let total = valuePrevDay.reduce((a, b) => {
				return a + b.Value;
			}, 0);
	
			let count = valuePrevDay.filter((e) => {
				return e.Value != null && e.Value != undefined;
			});
	
			let avg = total / count.length;

			result.push(avg);
		}

		let valuePrev2Day = await DataLogger.find({ TimeStamp: { $gte: startPrev2Day, $lte: endPrev2Day } });

		if(valuePrev2Day.length > 0)
		{
			let total = valuePrev2Day.reduce((a, b) => {
				return a + b.Value;
			}, 0);
	
			let count = valuePrev2Day.filter((e) => {
				return e.Value != null && e.Value != undefined;
			});
	
			let avg = total / count.length;

			result.push(avg);
		}
	}

	return result;
	  
}