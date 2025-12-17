const settings = require('../settings.json');
const uuid = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserModel = require('../model/user');

const isBrowser = () => {
    // Check multiple browser-specific APIs
    return (
        typeof window !== 'undefined' &&
        typeof document !== 'undefined' &&
        typeof navigator !== 'undefined' &&
        window.document === document
    );
};

module.exports.loginValidation = async function (req, res, next) {
    let username = req.body.username;
    let password = req.body.password;

    let result = await UserModel.find({ Username: username.toLowerCase() });

    if (result.length > 0) {
        let dbPassword = result[0].Password;
        if (bcrypt.compareSync(password, dbPassword)) {
            let token = jwt.sign(
                {
                    username: result[0].Username,
                    userid: result[0]._id,
                },
                process.env.JWT_KEY,
                //{ expiresIn: "1h" }
            );

            res.cookie('access_token', 'Bearer ' + token);
            res.cookie('username', result[0].Username);
            res.locals.role = result[0].Role;

            const ua = req.headers['user-agent']?.toLowerCase() || '';
            const sechua = req.headers['sec-ch-ua']?.toLowerCase() || '';
            const sechuaPlatform =
                req.headers['sec-ch-ua-platform']?.toLowerCase() || '';
            const isMobile =
                ua.includes('android') ||
                ua.includes('iphone') ||
                ua.includes('ipad') ||
                ua.includes('mobile') ||
                ua.includes('macintosh') ||
                ua.includes('intel mac os');
            const requested =
                req.headers['x-requested-with']?.toLowerCase() || '';

            if (requested) {
                return res.redirect('/dashboardVilog?' + 'app=true');
            } else if (isMobile) {
                if (sechua && sechuaPlatform) {
                    return res.redirect('/dashboardVilog');
                } else if (!sechua && !sechuaPlatform) {
                    if (ua.includes('safari')) {
                        return res.redirect('/dashboardVilog');
                    } else {
                        return res.redirect('/dashboardVilog?' + 'app=true');
                    }
                } else {
                    return res.redirect('/dashboardVilog?' + 'app=true');
                }
            }
            // if (isMobile && isBrowser()) {
            //     return res.redirect('/dashboardVilog');
            // } else if (isMobile && !isBrowser()) {
            //     return res.redirect('/dashboardVilog?' + 'app=true');
            // }

            next();
        } else {
            res.render('login', {
                title: settings.title,
                companyName: settings.CompanyName,
                errorLogin: '(*) Incorrect Username or Password',
            });
        }
    } else {
        res.render('login', {
            title: settings.title,
            companyName: settings.CompanyName,
            errorLogin: '(*) Incorrect Username or Password',
        });
    }
};
