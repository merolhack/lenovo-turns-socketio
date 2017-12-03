/**
 * MongoDB Schema
 */
// Dependencies
const mongoose = require('mongoose');

// Schema for the turn
const turnSchema = new mongoose.Schema({
    counter: {
        type: Number,
        required: true,
    },
    group: {
        type: String,
        trim: true,
        required: true,
    },
    window: {
        type: Number,
        required: false,
        default: 0,
    },
    mobileDateCreated: {
        type: Date,
    },
    completed: {
        type: Boolean,
        default: false,
    },
    reset: {
        type: Boolean,
        default: false,
    },
    username: {
        type: String,
        trim: true,
        required: false,
        default: '',
    },
}, {
    timestamps: true
});
const turnModel = mongoose.model('Turn', turnSchema);

module.exports = turnModel;
