const express = require('express');
const Post = require('../models/post');
const sitemapRouter = express.Router();

// Helper to format YYYY-MM-DD
const formatDate = (date = new Date()) =>
  date.toISOString().split("T")[0];

sitemapRouter.get("/sitemap.xml", async (req, res) => {
  try {
    res.set("Content-Type", "application/xml");
    res.set("Cache-Control", "public, max-age=3600");

    const baseUrl = "https://avrilwriters.com";

    // ---- STATIC HIGH-VALUE PAGES ----
    const staticPages = [
      { loc: "/", changefreq: "daily", priority: "1.0" },
      { loc: "/services", changefreq: "monthly", priority: "0.9" },
      { loc: "/pricing", changefreq: "monthly", priority: "0.9" },
      { loc: "/contact", changefreq: "yearly", priority: "0.5" },
      { loc: "/blog", changefreq: "weekly", priority: "0.8" },
      { loc: "/guides", changefreq: "weekly", priority: "0.8" },

      // Category hubs (you should create these)
      { loc: "/guides/math", changefreq: "weekly", priority: "0.7" },
      { loc: "/guides/physics", changefreq: "weekly", priority: "0.7" },
      { loc: "/guides/nursing", changefreq: "weekly", priority: "0.7" },
      { loc: "/guides/law", changefreq: "weekly", priority: "0.7" },
      { loc: "/guides/business", changefreq: "weekly", priority: "0.7" },
      { loc: "/guides/study-skills", changefreq: "weekly", priority: "0.7" },

      // Legal pages (low priority)
      { loc: "/privacy-policy", changefreq: "yearly", priority: "0.3" },
      { loc: "/refund-policy", changefreq: "yearly", priority: "0.3" },
    ];

    // ---- DYNAMIC BLOG POSTS (replace with your DB) ----
    // Example: const posts = await db.posts.findMany({ slug, updatedAt, category });
    const posts = Post.find({});

    const blogPages = posts.map((p) => ({
      loc: `/blog/${p.slug}`,
      lastmod: formatDate(p.updatedAt),
      changefreq: "monthly",
      priority: "0.6",
    }));

    const allPages = [
      ...staticPages.map((p) => ({
        ...p,
        lastmod: formatDate(),
      })),
      ...blogPages,
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (p) => `
  <url>
    <loc>${baseUrl}${p.loc}</loc>
    <lastmod>${p.lastmod}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  )
  .join("")}
</urlset>`;

    res.status(200).send(xml);
  } catch (err) {
    console.error("Sitemap error:", err);
    res.status(500).send("Sitemap generation failed");
  }
});

module.exports = sitemapRouter;
