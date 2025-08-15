const StaffSiteModel = require("../../model/staffSite");
const SiteModel = require("../../model/site");

module.exports.GetSiteByUserIdInStaffSite = async function (req, res) {
  let userId = req.params.userId;
  if (userId == "null") {
    userId = "";
  }
  res.json(await StaffSiteModel.find({ IdUser: userId }));
};

module.exports.UpdateStaffSite = async function (req, res) {
  let data = req.params.data;

  data = JSON.parse(data);

  if (data.length > 0) {
    // delete
    await StaffSiteModel.deleteMany({ IdUser: data[0].IdUser });
    // insert
    let result = await StaffSiteModel.insertMany(data);

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
  if (userId == "null") {
    userId = "";
  }

  let listIdSite = await StaffSiteModel.find(
    { IdUser: userId },
    { IdSite: 1, _id: 0 }
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
  if (userId == "null") {
    userId = "";
  }

  let listIdSite = await StaffSiteModel.find(
    { IdUser: userId },
    { IdSite: 1, _id: 0 }
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
