const settings = require('../settings.json');
const RouterConfigMiddelware = require('../middleware/routerConfig');

module.exports.configVilog = async function (req, res) {
    let content = await RouterConfigMiddelware.RouterConfig(req, res);

    res.render('configVilog', {
        title: settings.title,
        companyName: settings.CompanyName,
        username: req.cookies.username,
        content: content,
    });
};
