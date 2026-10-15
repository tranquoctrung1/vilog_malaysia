const mongoose = require('mongoose');

// Singleton document: chỉ tồn tại đúng 1 bản ghi trạng thái license cho cài đặt này.
var LicenseStateSchema = new mongoose.Schema({
    licenseKey: String,
    hardwareId: String,
    signedToken: String,
    sessionId: { type: String, default: null },
    expiresAt: Date,
    offlineGraceDays: Number,
    lastSuccessAt: Date,
    lastError: String,
});

var LicenseState = mongoose.model(
    'LicenseState',
    LicenseStateSchema,
    't_License_State',
);

module.exports = LicenseState;
