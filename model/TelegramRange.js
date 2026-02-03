const mongoose = require('mongoose');

const telegramRangeSchema = new mongoose.Schema({
    telegramId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 't_telegram',
        required: true,
    },
    rangeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 't_range',
        required: true,
    },
    assignedAt: {
        type: Date,
        default: Date.now,
    },
});

// Composite unique index để tránh trùng lặp
telegramRangeSchema.index({ telegramId: 1, rangeId: 1 }, { unique: true });

module.exports = mongoose.model('t_telegram_range', telegramRangeSchema);
