const ConsumerModel = require("../../model/consumer");

module.exports.GetConsumer = async function (req, res) {
  res.json(await ConsumerModel.find({}));
};

module.exports.GetConsumerById = async function (req, res) {
  let id = req.params.id;

  res.json(await ConsumerModel.find({ _id: id }));
};

module.exports.GetConsumerByName = async function (req, res) {
  let fullName = req.params.fullName;

  res.json(await ConsumerModel.find({ FullName: fullName }));
};

module.exports.InsertConsumer = async function (req, res) {
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

  let check = await ConsumerModel.find({ FullName: fullName });

  if (check.length == 0) {
    let result = await ConsumerModel.insertMany([
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

module.exports.UpdateConsumer = async function (req, res) {
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

  let result = await ConsumerModel.updateOne(
    { _id: id },
    { FullName: fullName, Telephone: telephone, Adrress: adrress }
  );

  res.json(result.nModified);
};

module.exports.DeleteConsumer = async function (req, res) {
  let id = req.params.id;
  if (id == "null") {
    id = "";
  }

  let result = await ConsumerModel.deleteOne({ _id: id });

  res.json(result.deletedCount);
};
