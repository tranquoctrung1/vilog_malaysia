const StaffModel = require("../../model/staff");

module.exports.GetStaff = async function (req, res) {
  res.json(await StaffModel.find({}));
};

module.exports.GetStaffById = async function (req, res) {
  let id = req.params.id;

  res.json(await StaffModel.find({ _id: id }));
};

module.exports.GetStaffByName = async function (req, res) {
  let fullName = req.params.fullName;

  res.json(await StaffModel.find({ FullName: fullName }));
};

module.exports.InsertStaff = async function (req, res) {
  let fullName = req.params.fullName;
  if (fullName == "null") {
    fullName = "";
  }
  let telephone = req.params.telephone;
  if (telephone == "null") {
    telephone = "";
  }
  let adrress = req.params.adrress;
  if (adrress == "null") {
    adrress = "";
  } else {
    adrress = adrress.replaceAll("_", "/");
  }

  let check = await StaffModel.find({ FullName: fullName });

  if (check.length == 0) {
    let result = await StaffModel.insertMany([
      { FullName: fullName, Telephone: telephone, Adrress: adrress },
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

module.exports.UpdateStaff = async function (req, res) {
  let id = req.params.id;
  if (id == "null") {
    id = "";
  }
  let fullName = req.params.fullName;
  if (fullName == "null") {
    fullName = "";
  }
  let telephone = req.params.telephone;
  if (telephone == "null") {
    telephone = "";
  }
  let adrress = req.params.adrress;
  if (adrress == "null") {
    adrress = "";
  } else {
    adrress = adrress.replaceAll("_", "/");
  }

  let result = await StaffModel.updateOne(
    { _id: id },
    { FullName: fullName, Telephone: telephone, Adrress: adrress }
  );

  res.json(result.nModified);
};

module.exports.DeleteStaff = async function (req, res) {
  let id = req.params.id;
  if (id == "null") {
    id = "";
  }

  let result = await StaffModel.deleteOne({ _id: id });

  res.json(result.deletedCount);
};
