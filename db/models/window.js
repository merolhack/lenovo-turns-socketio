/**
 * MongoDB Schema
 */
// Dependencies
const mongoose = require('mongoose');

// Schema for the window
const windowSchema = new mongoose.Schema({
    number: {
        type: Number,
        required: true,
    },
    username: {
        type: String,
        trim: true,
        required: false,
    },
    group: {
        type: String,
        trim: true,
        required: false,
    },
    locked: {
        type: Boolean,
        required: true,
    },
}, {
    timestamps: true
});
const windowModel = mongoose.model('window', windowSchema);

module.exports = windowModel;
