const express = require('express');
const Post = require('../models/post');

const blogRouter = express.Router();

const IMAGES_PATH = {
    logo: '/images/medical-team.png',
    favicon: '/images/favicon.png',
};

blogRouter.get('/sitemap.xml', async (req, res) => {
    try {
        const posts = await Post.find({}, 'slug date').sort({ date: -1 });

        const baseUrl = 'https://avrilwriters.com';
        const staticPages = [
            '',
            '/services',
            '/blog',
            '/place-order',
            '/login',
            '/contact',
        ];

        // Build the XML string
        let xml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

        // Add static pages
        staticPages.forEach(url => {
            xml += `<url>
            <loc>${baseUrl}${url}</loc>
            <changefreq>weekly</changefreq>
            <priority>${url === '' ? '1.0' : '0.8'}</priority>
        </url>`;
        });

        // Add dynamic blog posts
        posts.forEach(post => {
            xml += `<url>
            <loc>${baseUrl}/blog/${post.slug}</loc>
            <lastmod>${new Date(post.date).toISOString()}</lastmod>
            <changefreq>monthly</changefreq>
            <priority>0.6</priority>
        </url>`;
        });

        xml += `</urlset>`;

        // Send the response as XML
        res.header('Content-Type', 'application/xml');
        res.send(xml);
    } catch (err) {
        console.error(err);
        res.status(500).end();
    }
});

blogRouter.get('/links', (req, res) => {
    res.render('links.html', {
        images: IMAGES_PATH
    });
});

blogRouter.get('/services', (req, res) => {
    res.render('services.html', {
        images: IMAGES_PATH
    });
});

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
