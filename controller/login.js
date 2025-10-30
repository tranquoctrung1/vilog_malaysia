const settings = require('../settings.json');

module.exports.login = function (req, res) {
    res.render('login', {
        title: settings.title,
        companyName: settings.CompanyName,
        errorLogin: '',
    });
};

module.exports.validationLoggin = function (req, res) {
    const userAgent = req.headers['user-agent'] || '';
    const isMobile = /mobile|android|iphone|ipad|ipod/i.test(userAgent);

    if (isMobile) {
        res.redirect('/dashboardVilog');
    } else {
        res.redirect('/');
    }
};
