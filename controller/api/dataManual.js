const mongoose = require('mongoose');
const SiteModel = require('../../model/site');
const DataManualModel = require('../../model/DataManual');

module.exports.GetDataManual = async function (req, res) {
    let siteid = req.params.siteid;
    let result = await DataManualModel.find({ SiteId: siteid });

    res.json(result);
};

module.exports.InsertDataManual = async function (req, res) {
    let siteid = req.params.siteid;
    let start = req.params.start;
    let value = req.params.value;

    let startDate = new Date(parseInt(start));

    let check = await DataManualModel.find({
        TimeStamp: startDate,
        SiteId: siteid,
    });

    if (check.length == 0) {
        let result = await DataManualModel.insertMany([
            { SiteId: siteid, TimeStamp: startDate, Value: value },
        ]);

        if (result.length > 0) {
            res.json(result[0]._id);
        } else {
            res.json(0);
        }
    } else {
        res.json(0);
    }
};

module.exports.UpdateDataManual = async function (req, res) {
    let id = req.params.id;
    let value = req.params.value;

    let result = await DataManualModel.updateOne({ _id: id }, { Value: value });

    res.json(result.modifiedCount);
};

module.exports.DeleteDataManual = async function (req, res) {
    let id = req.params.id;

    let result = await DataManualModel.deleteOne({
        _id: id,
    });

    res.json(result.deletedCount);
};
