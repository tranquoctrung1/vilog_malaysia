const UserModel = require("../model/user");
const RouterConfigModel = require("../model/routerConfig");

module.exports.PermissionGetPage = async function (req, res) {
  let username = req.cookies.username;
  let url = req.baseUrl;
  //console.log(req);

  let result = await UserModel.find({ Username: username });

  if (result.length > 0) {
    let dataRouter = await RouterConfigModel.find({ Role: result[0].Role });
    for (let item of dataRouter[0].Function) {
      for (let i of item.Children) {
        if (url == i.url) {
          next();
          break;
        }
      }
    }
    res.render("404");
  } else {
    res.render("404");
  }
};
