const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    title: String,
    slug: {
        type: String,
        unique: true,
    },
    category: String,
    summary: String,
    content: String,
    imageIcon: String,
    date: {
        type: Date,
        default: Date.now,
    },
});

const Post = mongoose.model('Post', PostSchema);

module.exports = Post;
