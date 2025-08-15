const mongoose = require('mongoose');

var alarmSchema = new mongoose.Schema({
   ChannelId: String,
   HighValueAlarm: Boolean,
   MaxThreshold: String,
   LowValueAlarm: Boolean,
   MinThreshold: String,
   DelayAlarm: Boolean,
   MNF_Alarm: Boolean,
   IsDelay: Boolean,
   IsHighValue: Boolean,
   IsLowValue: Boolean,
   IsNoData: Boolean,
});

var Alarm = mongoose.model('Alarm', alarmSchema, 't_Alarm_Config');

module.exports  = Alarm;