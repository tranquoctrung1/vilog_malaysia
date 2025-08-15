const settings = require("../settings.json");
const RouterConfigMiddelware = require("../middleware/routerConfig");

module.exports.map = async function (req, res) {
  let content = await RouterConfigMiddelware.RouterConfig(req, res);

  res.render("home", {
    title: settings.title,
    companyName: settings.CompanyName,
    username: req.cookies.username,
    content: content,
  });
};
