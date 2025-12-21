const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: false
    },
    password: {
        type: String,
        required: false // Optional for Google SSO users
    }, // hashed password
    role: {
        type: String,
        enum: ['student', 'writer', 'admin'],
        default: 'student'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    walletBalance: {
        type: Number,
        default: 0
    },
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpires: {
        type: Date,
    },
    // Google OAuth fields
    googleId: {
        type: String,
        sparse: true,
        default: null
    },
    googleEmail: {
        type: String,
        sparse: true,
        lowercase: true,
        default: null
    },
    authProvider: {
        type: String,
        enum: ['email', 'google'],
        default: 'email'
    }
});

module.exports = mongoose.model('User', userSchema);
