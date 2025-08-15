const mongoose = require('mongoose');

var siteSchema = new mongoose.Schema({
    SiteId: String,
    Location: String,
    Latitude: String,
    Longitude: String,
    DisplayGroup: String,
    ConsumerId: String,
    LoggerId: String,
    StartDay: Number,
    StartHour: Number,
    Status: String,
    PipeSize: Number,
    InterVal: Number,
    Available: String,
    TimeDelay: Number,
    Note: String,
    IsPrimayer: Boolean,
    MNF: Number,
    TypeMeter: String,
    IMEI: String,
});

var Site = mongoose.model('Site', siteSchema, 't_Sites');

module.exports = Site;
