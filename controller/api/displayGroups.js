const DisplayGroupModel = require('../../model/DisplayGroup');

module.exports.GetDisplayGroup = async function (req, res) {
    res.json(await DisplayGroupModel.find({}));
};

module.exports.GetDisplayGroupByGroup = async function (req, res) {
    let group = req.params.group;
    res.json(await DisplayGroupModel.find({ Group: group }));
};

module.exports.InsertDisplayGroup = async function (req, res) {
    let group = req.params.group;
    if (group == 'null') {
        group = '';
    }
    let note = req.params.note;
    if (note == 'null') {
        note = '';
    }

    let check = await DisplayGroupModel.find({ Group: group });

    if (check.length == 0) {
        let result = await DisplayGroupModel.insertMany([
            { Group: group, Description: note },
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

module.exports.UpdateDipslayGroup = async function (req, res) {
    let id = req.params.id;
    if (id == 'null') {
        id = '';
    }
    let group = req.params.group;
    if (group == 'null') {
        group = '';
    }
    let note = req.params.note;
    if (note == 'null') {
        note = '';
    }

    let result = await DisplayGroupModel.updateOne(
        { _id: id },
        { Group: group, Description: note },
    );

    res.json(result.modifiedCount);
};

module.exports.DeleteDisplayGroup = async function (req, res) {
    let id = req.params.id;
    if (id == 'null') {
        id = '';
    }

    let result = await DisplayGroupModel.deleteOne({
        _id: id,
    });

    res.json(result.deletedCount);
};
