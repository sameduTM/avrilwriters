const mongoose = require('mongoose');
const User = require('../models/user');

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: User, // Links to your User model
        required: true
    },
    title: { type: String, required: true },
    type: { type: String, required: true },
    subject: { type: String, required: true },
    level: { type: String, required: true },
    writerCategory: { type: String, default: 'Standard' },

    deadline: { type: Date, required: true },
    pages: { type: Number, required: true },
    spacing: { type: String, default: 'Double Spaced' },

    instructions: { type: String },

    price: { type: Number, required: true },

    status: {
        type: String,
        enum: ['Pending', 'Bidding', 'In Progress', 'Completed', 'Cancelled'],
        default: 'Pending'
    },

    // 📂 THIS IS WHERE WE STORE THE FILES
    files: [{
        originalName: String,
        filename: String,
        path: String,
        size: Number,
        mimetype: String,
        uploadedAt: { type: Date, default: Date.now }
    }],
    // The Writer assigned to this order
    writerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: User,
        default: null,
    },
    // Completion tracking
    completedAt: {
        type: Date,
        default: null,
    },
    completedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: User,
        default: null,
    },
}, { timestamps: true }); // Adds createdAt and updatedAt automatically

module.exports = mongoose.model('Order', orderSchema);
