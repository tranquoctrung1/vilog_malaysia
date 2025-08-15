const mongoose = require('mongoose');

var displayGroup = new mongoose.Schema({
   Group: String,
   Description: String,
});

var DisplayGroup = mongoose.model('DisplayGroup', displayGroup, 't_DisplayGroups');

module.exports  = DisplayGroup;