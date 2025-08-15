const CameraModel = require("../../model/camera");

module.exports.GetListNameStation = async function (req, res) {
  res.json(await CameraModel.distinct("Name"));
};

module.exports.GetListDataCameraByStationName = async function (req, res) {
  let stationName = req.params.stationName;

  res.json(await CameraModel.find({ Name: stationName }));
};
