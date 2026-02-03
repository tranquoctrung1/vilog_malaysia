const settings = require('../settings.json');
const RouterConfigMiddelware = require('../middleware/routerConfig');

module.exports.configTelegram = async function (req, res) {
    let content = await RouterConfigMiddelware.RouterConfig(req, res);

    res.render('telegramConfig', {
        title: settings.title,
        companyName: settings.CompanyName,
        username: req.cookies.username,
        content: content,
    });
};
