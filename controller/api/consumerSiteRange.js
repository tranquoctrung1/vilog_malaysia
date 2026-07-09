const ConsumerSiteRangeModel = require('../../model/consumerSiteRange');

const VALID_FIELDS = ['SiteId', 'LoggerId'];

module.exports.GetRanges = async function (req, res) {
    let userId = req.params.userId;
    if (userId == 'null') {
        userId = '';
    }

    res.json(await ConsumerSiteRangeModel.find({ IdUser: userId }));
};

module.exports.AddRange = async function (req, res) {
    const data = req.body;

    const IdUser = data.IdUser;
    const Field = data.Field;
    const From = Number(data.From);
    const To = Number(data.To);

    if (!IdUser || IdUser == 'null') {
        res.status(400).json({ error: 'IdUser is required' });
        return;
    }

    if (!VALID_FIELDS.includes(Field)) {
        res.status(400).json({ error: "Field must be 'SiteId' or 'LoggerId'" });
        return;
    }

    if (Number.isNaN(From) || Number.isNaN(To)) {
        res.status(400).json({ error: 'From and To must be numeric' });
        return;
    }

    if (From > To) {
        res.status(400).json({ error: 'From must be less than or equal to To' });
        return;
    }

    const result = await ConsumerSiteRangeModel.create({
        IdUser: IdUser,
        Field: Field,
        From: From,
        To: To,
    });

    res.json(result);
};

module.exports.DeleteRange = async function (req, res) {
    const id = req.params.id;

    const result = await ConsumerSiteRangeModel.deleteOne({ _id: id });

    res.json(result.deletedCount);
};
