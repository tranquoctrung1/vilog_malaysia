const settings = require("../settings.json");
const uuid = require("uuid");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const UserModel = require("../model/user");

module.exports.loginValidation = async function (req, res, next) {
  let username = req.body.username;
  let password = req.body.password;

  let result = await UserModel.find({ Username: username.toLowerCase() });

  if (result.length > 0) {
    let dbPassword = result[0].Password;
    if (bcrypt.compareSync(password, dbPassword)) {
      let token = jwt.sign(
        {
          username: result[0].Username,
          userid: result[0]._id,
        },
        process.env.JWT_KEY,
        //{ expiresIn: "1h" }
      );

      res.cookie("access_token", "Bearer " + token);
      res.cookie("username", result[0].Username);
      res.locals.role = result[0].Role;

      next();
    } else {
      res.render("login", {
        title: settings.title,
        companyName: settings.CompanyName,
        errorLogin: "(*) Incorrect Username or Password",
      });
    }
  } else {
    res.render("login", {
      title: settings.title,
      companyName: settings.CompanyName,
      errorLogin: "(*) Incorrect Username or Password",
    });
  }
};
