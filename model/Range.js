const mongoose = require('mongoose');

const rangeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    start: {
        type: Number,
        required: true,
        min: 0,
    },
    end: {
        type: Number,
        required: true,
        min: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

rangeSchema.pre('save', function (next) {
    if (this.start > this.end) {
        next(new Error('Start range must be less than or equal to end range'));
    }
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('t_range', rangeSchema);
