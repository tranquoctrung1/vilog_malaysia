const jwt = require('jsonwebtoken');
const UserModel = require('../model/user');

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

// Chỉ cho Role 'admin'. Lấy username từ JWT (không tin cookie username - client sửa được).
module.exports.requireAdmin = function (req, res, next) {
    try {
        let token = req.cookies.access_token.split(' ')[1];

        jwt.verify(token, process.env.JWT_KEY, async function (err, decoded) {
            if (err) {
                return res.redirect('/login');
            }

            try {
                const user = await UserModel.findOne({
                    Username: decoded.username,
                });

                if (user && user.Role === 'admin') {
                    return next();
                }

                return res.status(403).render('404');
            } catch (e) {
                return res.status(403).render('404');
            }
        });
    } catch (err) {
        res.redirect('/login');
    }
};

module.exports.verifyAccessToken =function (req, res, next) {
    try {
        let token = req.headers.access_token;

        jwt.verify(token, process.env.JWT_KEY, function (err, decoded) {
            if (err) {
                res.status(400).json({ error: err });
            } else {
                req.username = decoded.username;
                next();
            }
        });
    } catch (err) {
        res.status(400).json({ error: err });
    }
};
