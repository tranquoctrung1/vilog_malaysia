const mongoose = require('mongoose');

var historyAlarm = new mongoose.Schema({
   SiteId: String,
   Location: String,
   ChanneId:  String,
   ChannelName: String,
   LoggerId:  String,
   Content: String,
   TimeStampHasValue: Date,
   TimeStampAlarm: Date,
   Type: Number,
});

var HistoryAlarm = mongoose.model('HistoryAlarm', historyAlarm, 't_History_Alarm');

module.exports  = HistoryAlarm;