const mongoose = require('mongoose');

var DeviceTokenApp = new mongoose.Schema({
    UserName: String,
    DeviceToken: String,
    Status: Boolean,
    Sound: Boolean,
});

var DeviceTokenApp = mongoose.model(
    'DeviceTokenApp',
    DeviceTokenApp,
    'DeviceTokenApp',
);

module.exports = DeviceTokenApp;
