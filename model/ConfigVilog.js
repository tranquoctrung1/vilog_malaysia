const mongoose = require('mongoose');

var configVilogSchema = new mongoose.Schema({
    oldSiteId: String,
    oldLocation: String,
    siteId: String,
    location: String,
    typeMeter: String,
    logTime: String,
    sendTime: String,
    isComplete: Boolean,
});

var ConfigVilog = mongoose.model(
    'ConfigVilog',
    configVilogSchema,
    't_ConfigVilog',
);

module.exports = ConfigVilog;
