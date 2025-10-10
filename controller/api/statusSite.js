const SiteModel = require('../../model/site');
const ChannelModel = require('../../model/Channel.js');
const UserModel = require('../../model/user');
const ConsumerSiteModel = require('../../model/consumerSite');
const StaffSiteModel = require('../../model/staffSite');

module.exports.GetStatusSite = async function (req, res) {
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

    let result = {};
    result.totalSite = 0;
    result.totalSiteHasValue = 0;
    result.totalSiteDelay = 0;
    result.totalSiteAlarm = 0;
    result.sites = [];
    result.siteDelay = [];
    result.siteAlarm = [];
    result.siteHasValue = [];

    let timeDelay = 60;

    if (listSite.length > 0) {
        result.totalSite = listSite.length;

        for (let site of listSite) {
            let channels = await ChannelModel.find({ LoggerId: site.LoggerId });
            const objSite = { ...site._doc, ListChannel: [...channels] };
            result.sites.push(objSite);

            if (
                site.TimeDelay != 'null' &&
                site.TimeDelay != null &&
                site.TimeDelay != undefined
            ) {
                timeDelay = site.TimeDelay;
            }

            let isError = false;
            let isDelay = false;

            for (let channel of channels) {
                if (isError == false) {
                    if (
                        Math.round(
                            (Date.now() - channel.TimeStamp.getTime()) /
                                1000 /
                                60,
                        ) > timeDelay
                    ) {
                        result.totalSiteDelay += 1;
                        result.siteDelay.push(site);
                        isError = true;
                        isDelay = true;
                    } else {
                        let isOverflow = false;
                        if (isOverflow == false) {
                            if (channel.BaseMin != null) {
                                if (channel.LastValue < channel.BaseMin) {
                                    result.totalSiteAlarm += 1;
                                    isOverflow = true;
                                    isError = true;
                                    result.siteAlarm.push(site);
                                }
                            }
                        }
                        if (isOverflow == false) {
                            if (channel.BaseMax != null) {
                                if (channel.LastValue > channel.BaseMax) {
                                    result.totalSiteAlarm += 1;
                                    isOverflow = true;
                                    isError = true;
                                    result.siteAlarm.push(site);
                                }
                            }
                        }
                        if (isOverflow == false) {
                            if (channel.Baseline != null) {
                                if (channel.LastValue > channel.BaseLine) {
                                    result.totalSiteAlarm += 1;
                                    isOverflow = true;
                                    isError = true;
                                    result.siteAlarm.push(site);
                                }
                            }
                        }
                    }
                }
            }

            if (isDelay == false) {
                result.siteHasValue.push(site);
                result.totalSiteHasValue += 1;
            }
        }
    }

    res.json(result);
};
