const DeviceLoggerModel = require("../../model/DeviceLogger");

module.exports.GetAllDeviceLogger = async function (req, res) {
  let result = await DeviceLoggerModel.find({});

  res.json(result);
};

module.exports.GetDeviceLoggerBySerial = async function (req, res) {
  let serial = req.params.serial;

  let result = await DeviceLoggerModel.find({ Serial: serial });

  res.json(result);
};

module.exports.InsertDeviceLogger = async function (req, res) {
  let serial = req.params.serial;
  if (serial == "null") {
    serial = "";
  }
  let date = req.params.datePushStock;
  if (date == "null" || date == "NaN") {
    date = new Date(Date.now());
  } else {
    date = new Date(parseInt(date));
  }

  let producer = req.params.producer;
  if (producer == "null") {
    producer = "";
  }
  let branch = req.params.branch;
  if (branch == "null") {
    branch = "";
  }
  let model = req.params.model;
  if (model == "null") {
    model = "";
  }
  let status = req.params.status;
  if (status == "null") {
    status = "";
  }
  let note = req.params.note;
  if (note == "null") {
    note = "";
  }
  let isInstall = req.params.isInstall;
  if (isInstall == "null") {
    isInstall = false;
  }
  let urlUploadFile = req.params.urlUploadFile;
  if (isInstall == "null") {
    isInstall = "";
  }

  let check = await DeviceLoggerModel.find({ Serial: serial });

  if (check.length == 0) {
    let result = await DeviceLoggerModel.insertMany([
      {
        Serial: serial,
        DatePushStock: date,
        Producer: producer,
        Branch: branch,
        Model: model,
        Status: status,
        Note: note,
        IsInstall: isInstall,
        urlUploadFile: urlUploadFile,
      },
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

module.exports.UpdateDeviceLogger = async function (req, res) {
  let id = req.params.id;
  let serial = req.params.serial;
  if (serial == "null") {
    serial = "";
  }
  let date = req.params.datePushStock;
  if (date == "null" || date == "NaN") {
    date = new Date(Date.now());
  } else {
    date = new Date(parseInt(date));
  }

  let producer = req.params.producer;
  if (producer == "null") {
    producer = "";
  }
  let branch = req.params.branch;
  if (branch == "null") {
    branch = "";
  }
  let model = req.params.model;
  if (model == "null") {
    model = "";
  }
  let status = req.params.status;
  if (status == "null") {
    status = "";
  }
  let note = req.params.note;
  if (note == "null") {
    note = "";
  }
  let isInstall = req.params.isInstall;
  if (isInstall == "null") {
    isInstall = false;
  }
  let urlUploadFile = req.params.urlUploadFile;
  if (isInstall == "null") {
    isInstall = "";
  }

  let result = await DeviceLoggerModel.updateOne(
    { _id: id },
    {
      Serial: serial,
      DatePushStock: date,
      Producer: producer,
      Branch: branch,
      Model: model,
      Status: status,
      Note: note,
      IsInstall: isInstall,
      urlUploadFile: urlUploadFile,
    }
  );

  res.json(result.nModified);
};

module.exports.DeleteDeviceLogger = async function (req, res) {
  let id = req.params.id;

  let result = await DeviceLoggerModel.deleteOne({
    _id: id,
  });

  res.json(result.deletedCount);
};
