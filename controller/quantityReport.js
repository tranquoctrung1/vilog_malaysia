const settings = require("../settings.json");
const RouterConfigMiddelware = require("../middleware/routerConfig");

module.exports.quantityReport = async function (req, res) {
  let content = await RouterConfigMiddelware.RouterConfig(req, res);

  res.render("quantityHourReport", {
    title: settings.title,
    companyName: settings.CompanyName,
    username: req.cookies.username,
    content: content,
  });
};

module.exports.quantityDayReport = async function (req, res) {
  let content = await RouterConfigMiddelware.RouterConfig(req, res);
  res.render("quantityDayReport", {
    title: settings.title,
    companyName: settings.CompanyName,
    username: req.cookies.username,
    content: content,
  });
};

module.exports.quantityMonthReport = async function (req, res) {
  let content = await RouterConfigMiddelware.RouterConfig(req, res);
  res.render("quantityMonthReport", {
    title: settings.title,
    companyName: settings.CompanyName,
    username: req.cookies.username,
    content: content,
  });
};

module.exports.quantityYearReport = async function (req, res) {
  let content = await RouterConfigMiddelware.RouterConfig(req, res);
  res.render("quantityYearReport", {
    title: settings.title,
    companyName: settings.CompanyName,
    username: req.cookies.username,
    content: content,
  });
};
