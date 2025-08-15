const settings = require('../settings.json');

module.exports.login = function (req, res) {
    res.render('login', {title: settings.title, companyName: settings.CompanyName, errorLogin: ""})
}

module.exports.validationLoggin = function (req, res) {
        res.redirect('/')
}
