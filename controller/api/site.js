const SiteModel = require('../../model/site');
const UserModel = require('../../model/user');
const ConsumerSiteModel = require('../../model/consumerSite');
const StaffSiteModel = require('../../model/staffSite');
const ChannelModel = require('../../model/Channel.js');
const mongoose = require('mongoose');
const { getPermittedSiteIds } = require('../../helper/sitePermission');

module.exports.GetSiteForSWOC = async function (req, res) {
    const result = [];
    const username = req.username;
    let user = await UserModel.findOne({ Username: username });

    const permittedIds = await getPermittedSiteIds(user);

    let listSite;
    if (permittedIds === null) {
        listSite = await SiteModel.find({}).sort({ SiteId: 1 });
    } else if (permittedIds.length > 0) {
        listSite = await SiteModel.find({ _id: { $in: permittedIds } }).sort({
            SiteId: 1,
        });
    } else {
        listSite = [];
    }

    for (const item of listSite) {
        const obj = {};
        obj.SiteId = item.SiteId;
        obj.SiteName = item.Location;
        obj.LoggerId = item.LoggerId;
        obj.localInstall = item.Location;
        obj.Latitude = item.Latitude;
        obj.Longitude = item.Longitude;

        result.push(obj);
    }

    res.status(200).json(result);
};

module.exports.GetSiteByUid = async function (req, res) {
    const userid = req.params.userid;

    let user = await UserModel.findOne({ Username: userid });

    if (!user) {
        res.json([]);
        return;
    }

    const permittedIds = await getPermittedSiteIds(user);

    let listSite;
    if (permittedIds === null) {
        listSite = await SiteModel.find({});
    } else if (permittedIds.length > 0) {
        listSite = await SiteModel.find({ _id: { $in: permittedIds } });
    } else {
        listSite = [];
    }

    res.json(listSite);
};

module.exports.GetSiteByDisplayGroup = async function (req, res) {
    const displayGroup = req.params.displayGroup;

    res.json(await SiteModel.find({ DisplayGroup: displayGroup }));
};

module.exports.GetSiteBySiteId = async function (req, res) {
    const siteid = req.params.siteid;

    res.json(await SiteModel.find({ SiteId: siteid }));
};

module.exports.InsertSite = async function (req, res) {
    const data = req.body;

    let check = await SiteModel.find({ SiteId: data.SiteId });

    data.PipeSize = 0;
    data.MNF = 0;

    if (check.length == 0) {
        let result = await SiteModel.insertMany([data]);

        if (result.length > 0) {
            res.json(result[0]._id);
        } else {
            res.json(0);
        }
    } else {
        res.json(0);
    }
};

module.exports.UpdateSite = async function (req, res) {
    try {
        const data = req.body;
        data.PipeSize = data.PipeSize !== 'null' ? data.PipeSize : 0;
        data.MNF = data.MNF !== 'null' ? data.MNF : 0;
        data.TimeDelay =
            data.TimeDelay !== 'null' ? parseFloat(data.TimeDelay) : 60;

        let result = await SiteModel.updateOne(
            { _id: data.id },
            {
                SiteId: data.SiteId,
                Location: data.Location,
                Latitude: data.Latitude,
                Longitude: data.Longitude,
                DisplayGroup: data.DisplayGroup,
                LoggerId: data.LoggerId,
                StartDay: data.StartDay,
                StartHour: data.StartHour,
                Status: data.Status,
                PipeSize: data.PipeSize,
                InterVal: data.InterVal,
                Available: data.Available,
                TimeDelay: data.TimeDelay,
                Note: data.Note,
                IsPrimayer: data.IsPrimayer,
                MNF: data.MNF,
                TypeMeter: data.TypeMeter,
            },
        );

        res.json(result.modifiedCount);
    } catch (err) {
        console.log(err);
    }
};

async function dropCollectionIfExists(name) {
    try {
        await mongoose.connection.db.dropCollection(name);
    } catch (err) {
        // NamespaceNotFound (26): collection never created, nothing to drop
        if (err.code !== 26) console.log(err);
    }
}

module.exports.DeleteSite = async function (req, res) {
    try {
        const id = req.body.id;

        if (!mongoose.isValidObjectId(id)) {
            res.json(0);
            return;
        }

        const site = await SiteModel.findById(id);

        let result = await SiteModel.deleteOne({ _id: id });

        let result2 = await ConsumerSiteModel.deleteOne({ IdSite: id });

        let result3 = await StaffSiteModel.deleteOne({ IdSite: id });

        const loggerId = site && site.LoggerId ? String(site.LoggerId).trim() : '';

        // Only cascade when no other site still uses the same logger
        if (result.deletedCount > 0 && loggerId !== '') {
            const otherSite = await SiteModel.exists({ LoggerId: loggerId });

            if (!otherSite) {
                const channels = await ChannelModel.find({ LoggerId: loggerId });

                for (const channel of channels) {
                    const channelId = channel.ChannelId
                        ? String(channel.ChannelId).trim()
                        : '';

                    if (channelId !== '' && channelId !== 'null') {
                        await dropCollectionIfExists('t_Data_Logger_' + channelId);
                        await dropCollectionIfExists('t_Index_Logger_' + channelId);
                    }
                }

                await ChannelModel.deleteMany({ LoggerId: loggerId });
            }
        }

        res.json(result.deletedCount);
    } catch (err) {
        console.log(err);
        res.json(0);
    }
};
