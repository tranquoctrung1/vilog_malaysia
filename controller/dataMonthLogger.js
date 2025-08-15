const settings = require("../settings.json");
const RouterConfigMiddelware = require("../middleware/routerConfig");

module.exports.dataMonthLogger = async function (req, res) {
  let content = await RouterConfigMiddelware.RouterConfig(req, res);

  res.render("dataMonthLogger", {
    title: settings.title,
    companyName: settings.CompanyName,
    username: req.cookies.username,
    content: content,
  });
};
