const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        index: true, // Helps fetch messages for an order quickly
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // store the name specifically so we don't populate the user
    senderName: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
        trim: true,
    },
    isSystemMessage: {
        type: Boolean,
        default: false,
    },
    readByReceiver: {
        type: Boolean,
        default: false,
    }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
