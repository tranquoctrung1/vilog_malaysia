const UserModel = require("../../model/user");
const bcrypt = require("bcryptjs");
const md5 = require("md5");

module.exports.GetUser = async function (req, res) {
  res.json(await UserModel.find({}));
};

module.exports.GetUserByUserName = async function (req, res) {
  let username = req.params.username;

  res.json(await UserModel.find({ Username: username }));
};

module.exports.GetUserByRoleStaff = async function (req, res) {
  res.json(await UserModel.find({ Role: "staff" }));
};

module.exports.GetUserByRoleConsumer = async function (req, res) {
  res.json(await UserModel.find({ Role: "consumer" }));
};

module.exports.GetUserById = async function (req, res) {
  let id = req.params.id;

  res.json(await UserModel.find({ _id: id }));
};

module.exports.CheckExistsUserName = async function (req, res) {
  let username = req.params.username;
  if (username == "null") {
    username = "";
  }

  let check = await UserModel.find({ Username: username });

  if (check.length > 0) {
    res.json(1);
  } else {
    res.json(0);
  }
};

module.exports.InsertUser = async function (req, res) {
  let username = req.params.username;
  if (username == "null") {
    username = "";
  }
  let password = req.params.password;
  let pfm = "";
  if (password == "null") {
    password = "";
    pfm = "";
  } else {
    let salt = bcrypt.genSaltSync(parseInt(process.env.GEN_SALT || 10));
    pfm = md5(password);
    password = bcrypt.hashSync(password, salt);
  }
  let email = req.params.email;
  if (email == "null") {
    email = "";
  }
  let consumerId = req.params.consumerId;
  if (consumerId == "null") {
    consumerId = "";
  }
  let staffId = req.params.staffId;
  if (staffId == "null") {
    staffId = "";
  }
  let role = req.params.role;
  if (role == "null") {
    role = "";
  }

  let check = await UserModel.find({ Username: username });

  if (check.length == 0) {
    let result = await UserModel.insertMany([
      {
        Username: username,
        Password: password,
        pfm: pfm,
        Salt: "",
        StaffId: staffId,
        ConsumerId: consumerId,
        Email: email,
        Role: role,
        Active: 1,
        TimeStamp: "",
        Ip: "",
        LoginTime: 0,
        Language: "vi",
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

module.exports.UpdateUser = async function (req, res) {
  let id = req.params.id;
  if (id == "null") {
    id = "";
  }
  let username = req.params.username;
  if (username == "null") {
    username = "";
  }
  let password = req.params.password;
  let pfm = "";
  if (password == "null") {
    password = "";
    pfm = "";
  } else {
    let salt = bcrypt.genSaltSync(parseInt(process.env.GEN_SALT || 10));
    pfm = md5(password);
    password = bcrypt.hashSync(password, salt);
  }
  let email = req.params.email;
  if (email == "null") {
    email = "";
  }
  let consumerId = req.params.consumerId;
  if (consumerId == "null") {
    consumerId = "";
  }
  let staffId = req.params.staffId;
  if (staffId == "null") {
    staffId = "";
  }
  let role = req.params.role;
  if (role == "null") {
    role = "";
  }

  let result = await UserModel.updateOne(
    { _id: id },
    {
      Username: username,
      Password: password,
      pfm: pfm,
      StaffId: staffId,
      ConsumerId: consumerId,
      Email: email,
      Role: role,
    }
  );

  res.json(result.nModified);
};

module.exports.DeleteUser = async function (req, res) {
  let id = req.params.id;
  if (id == "null") {
    id = "";
  }

  let result = await UserModel.deleteOne({ _id: id });

  res.json(result.deletedCount);
};
