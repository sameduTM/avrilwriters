const express = require('express');
const Post = require('../models/post');

const blogRouter = express.Router();

const IMAGES_PATH = {
    logo: '/images/medical-team.png',
    favicon: '/images/favicon.png',
};

blogRouter.get('/blog', async (req, res) => {
    try {
        // Fetch all posts
        const posts = await Post.find().sort({ date: -1 });

        res.render('blog.html', {
            images: IMAGES_PATH,
            posts,
        });
    } catch (err) {
        res.status(500).send("Database Error:", err);
    }
});

blogRouter.get('/blog/:slug', async (req, res) => {
    try {
        // Find post in the DB that matches the URL slug
        const post = await Post.findOne({ slug: req.params.slug });

        if (!post) {
            return res.status(404).send('Article not found');
        }

        // Render the SINGLE generic template, but pass specific post data
        res.render('blog-post.html', {
            post: post,
            images: IMAGES_PATH,
        });
    } catch (err) {
        res.status(500).send('Server Error:', err);
    }
});

module.exports = blogRouter;
