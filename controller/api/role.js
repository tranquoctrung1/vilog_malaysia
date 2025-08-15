const RoleModel = require("../../model/role");

module.exports.GetRole = async function (req, res) {
  res.json(await RoleModel.find({}));
};
