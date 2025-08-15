const mongoose = require('mongoose');
const SiteModel = require('../../model/site');
const UserModel = require('../../model/user');
const ChannelModel = require('../../model/Channel.js');
const ConsumerSiteModel = require('../../model/consumerSite');
const StaffSiteModel = require('../../model/staffSite');

module.exports.GetTableDataCurrent = async function (req, res) {
    const userid = req.params.userid;

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
            listSites = await SiteModel.find({ _id: { $in: list } });
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

    let result = [];

    for (let site of listSite) {
        let listChannels = await ChannelModel.find({
            LoggerId: site.LoggerId,
        }).sort({ ChannelName: 1 });

        let obj = {};
        obj.SiteId = site.SiteId;
        obj.Location = site.Location;
        obj.LoggerId = site.LoggerId;
        obj.ListChannel = [];
        obj.isError = false;
        obj.isDelay = false;

        let timeDelay = site.TimeDelay;

        for (let channel of listChannels) {
            let obj2 = {};
            obj2.ChannelId = channel.ChannelId;
            obj2.ChannelName = channel.ChannelName;
            obj2.TimeStamp = channel.TimeStamp;
            obj2.Value = channel.LastValue;
            obj2.Unit = channel.Unit;
            obj2.isError = false;
            obj2.isDelay = false;

            if (channel.TimeStamp != null) {
                let diff = Math.round(
                    (Date.now() - channel.TimeStamp.getTime()) / 1000 / 60,
                );
                if (diff > timeDelay) {
                    obj2.isDelay = true;
                    obj.isDelay = true;
                }
            }

            if (channel.LastValue !== null) {
                if (channel.LastValue < channel.BaseMin) {
                    obj2.isError = true;
                    obj.isError = true;
                }
                if (channel.LastValue > channel.BaseMax) {
                    obj2.isError = true;
                    obj.isError = true;
                }
            }

            if (site.TypeMeter === 'SU') {
                if (channel.OtherChannel === true) {
                    if (channel.LastValue !== 0) {
                        obj2.isError = true;
                        obj.isError = true;
                    }
                }
            } else if (site.TypeMeter === 'kronhe') {
                if (channel.OtherChannel === true) {
                    if (channel.LastValue >= 1) {
                        obj2.isError = true;
                        obj.isError = true;
                    }
                }
            }

            obj.ListChannel.push(obj2);
        }

        result.push(obj);
    }

    res.json(result);
};
