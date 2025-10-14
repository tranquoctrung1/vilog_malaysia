const ConsumerSiteModel = require('../../model/consumerSite');
const SiteModel = require('../../model/site');

module.exports.GetSiteByUserIdInConsumerSite = async function (req, res) {
    let userId = req.params.userId;
    if (userId == 'null') {
        userId = '';
    }
    res.json(await ConsumerSiteModel.find({ IdUser: userId }));
};

module.exports.UpdateConsumerSite = async function (req, res) {
    let data = req.body;

    if (data.length > 0) {
        // delete
        await ConsumerSiteModel.deleteMany({ IdUser: data[0].IdUser });
        // insert
        let result = await ConsumerSiteModel.insertMany(data);

        if (result.length > 0) {
            res.json(1);
        } else {
            res.json(1);
        }
    } else {
        res.json(0);
    }
};

module.exports.GetSitePermission = async function (req, res) {
    let userId = req.params.userId;
    if (userId == 'null') {
        userId = '';
    }

    let listIdSite = await ConsumerSiteModel.find(
        { IdUser: userId },
        { IdSite: 1, _id: 0 },
    );

    let list = [];

    for (let item of listIdSite) {
        list.push(item.IdSite);
    }

    if (listIdSite.length > 0) {
        let result = await SiteModel.find({ _id: { $in: list } });

        res.json(result);
    } else {
        res.json([]);
    }
};

module.exports.GetSiteNotPermission = async function (req, res) {
    let userId = req.params.userId;
    if (userId == 'null') {
        userId = '';
    }

    let listIdSite = await ConsumerSiteModel.find(
        { IdUser: userId },
        { IdSite: 1, _id: 0 },
    );

    let list = [];

    for (let item of listIdSite) {
        list.push(item.IdSite);
    }

    if (listIdSite.length > 0) {
        let result = await SiteModel.find({ _id: { $nin: list } });

        res.json(result);
    } else {
        res.json(await SiteModel.find({}));
    }
};
