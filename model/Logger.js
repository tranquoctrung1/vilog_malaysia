const mongoose = require('mongoose');

var loggerSchema = new mongoose.Schema({
    LoggerId: String,
    SiteId: String,
    TelephoneNumber: String,
    Pressure1: Number,
    ForwardFlow: Number,
    Interval: Number
});

var Logger = mongoose.model('Logger', loggerSchema, 't_Logger_Configurations');

module.exports  = Logger;