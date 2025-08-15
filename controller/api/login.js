const UserModel = require('../../model/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports.Login = async function (req, res) {
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

            res.json({ token });
        } else {
            res.json({ error: 'login failed' });
        }
    } else {
        res.json({ error: 'login failed' });
    }
};
