const jwt = require('jsonwebtoken');

module.exports.auth = function (req, res, next) {
    try {
        let token = req.cookies.access_token.split(' ')[1];

        jwt.verify(token, process.env.JWT_KEY, function (err, decoded) {
            if (err) {
                res.redirect('/login');
            } else {
                next();
            }
        });
    } catch (err) {
        res.redirect('/login');
    }
};

module.exports.verifyAccessToken = function (req, res, next) {
    try {
        let token = req.headers.access_token;

        jwt.verify(token, process.env.JWT_KEY, function (err, decoded) {
            if (err) {
                res.status(400).json({ error: err });
            } else {
                next();
            }
        });
    } catch (err) {
        res.status(400).json({ error: err });
    }
};
