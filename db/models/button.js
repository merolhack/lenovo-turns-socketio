/**
 * MongoDB Schema
 */
// Dependencies
const mongoose = require('mongoose');

// Schema for the button
const buttonSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
    },
    name: {
        type: String,
        trim: true,
        required: true,
    },
    title: {
        type: String,
        trim: true,
        required: true,
    },
    group: {
        type: String,
        trim: true,
        required: true,
    },
    order: {
        type: Number,
        required: true,
        default: 0
    }
}, {
    timestamps: true
});
const buttonModel = mongoose.model('button', buttonSchema);

module.exports = buttonModel;
