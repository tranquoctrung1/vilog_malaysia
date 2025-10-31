const UserModel = require('../../model/user');
const DeviceTokenAppModel = require('../../model/DeviceTokenApp');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports.getToken = async function (req, res) {
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
                { expiresIn: '3d' },
            );

            res.status(200).json(token);
        } else {
            res.status(400).json({ error: 'username or password invalid' });
        }
    } else {
        res.status(400).json({ error: 'username or password invalid' });
    }
};

module.exports.InsertDeviceTokenApp = async function (req, res) {
    let token = req.body;

    let check = await DeviceTokenAppModel.find({
        DeviceToken: token.DeviceToken,
    });

    if (check.length == 0) {
        let result = await DeviceTokenAppModel.insertMany([token]);

        if (result.length > 0) {
            res.json(result[0]._id);
        } else {
            res.json(0);
        }
    } else {
        res.json(0);
    }
};
