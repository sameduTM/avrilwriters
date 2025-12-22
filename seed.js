const mongoose = require('mongoose');

// Connect to the SAME database as server.js
mongoose.connect('mongodb://127.0.0.1:27017/avrilwriters');

// Define Schema (Must match server.js)
const Post = mongoose.model('Post', new mongoose.Schema({
    title: String,
    slug: String,
    category: String,
    summary: String,
    content: String,
    imageIcon: String,
    date: { type: Date, default: Date.now }
}));

const articles = [
    {
        title: "How to Pass the ATI TEAS 7 in 2 Weeks",
        slug: "teas-guide",
        category: "Study Strategy",
        imageIcon: "📚",
        summary: "Don't panic about your exam date. Here is a crammed strategy focusing on high-yield math and science topics.",
        content: `
            <p class="text-xl font-medium">Is your exam date looming? Don't panic. You don't need to read the whole textbook; you need a strategy.</p>
            <h3 class="text-2xl font-bold text-slate-900 pt-6">1. The Must-Know Topics</h3>
            <p>Focus 80% of your time on Science (Anatomy) and Math (Metric Conversions). These are the highest yield areas.</p>
            <h3 class="text-2xl font-bold text-slate-900 pt-6">2. The Q/A Strategy</h3>
            <p>Passive reading fails. You need to practice with questions that mimic the actual exam format to recognize patterns.</p>
        `
    },
    {
        title: "HESI A2 vs. HESI Exit: What’s the Difference?",
        slug: "hesi-vs-exit",
        category: "Exam Guide",
        imageIcon: "🏥",
        summary: "Confusion between entrance and exit exams is common. We break down the content differences and how to ace both.",
        content: `
            <p class="text-xl font-medium">One gets you into nursing school, the other lets you graduate. Mixing them up is a disaster.</p>
            <h3 class="text-2xl font-bold text-slate-900 pt-6">HESI A2 (Admission Assessment)</h3>
            <p>This tests basic academic readiness: Grammar, Vocab, Basic Math, and Biology.</p>
            <h3 class="text-2xl font-bold text-slate-900 pt-6">HESI Exit</h3>
            <p>This mimics the NCLEX. It tests critical thinking, prioritization (Who do you see first?), and clinical judgment.</p>
        `
    },
    {
        title: "Stop Drowning in Paperwork: Care Plans in 1 Hour",
        slug: "care-plans",
        category: "Paperwork",
        imageIcon: "✍️",
        summary: "Learn the ADPIE hack to write clinically accurate nursing care plans without spending all night typing.",
        content: `
            <p class="text-xl font-medium">You'd rather be in clinicals than typing up 10-page care plans. Here is the shortcut.</p>
            <h3 class="text-2xl font-bold text-slate-900 pt-6">The ADPIE Hack</h3>
            <p>Structure every plan strictly by Assessment, Diagnosis, Planning, Implementation, and Evaluation. Don't reinvent the wheel—use NANDA approved lists.</p>
        `
    },
    {
        title: "Surviving Proctorio & Respondus: 5 Tips",
        slug: "proctorio-tips",
        category: "Proctored Exams",
        imageIcon: "🔒",
        summary: "Worried about the webcam? Here are technical and behavioral tips to ensure a stress-free proctored exam.",
        content: `
            <p class="text-xl font-medium">Remote proctoring is stressful. One wrong look and your exam is flagged. Here is how to survive.</p>
            <h3 class="text-2xl font-bold text-slate-900 pt-6">1. The Environment</h3>
            <p>Clear your desk completely. Use a mirror to show the screen if asked. Ensure your lighting is in front of you, not behind.</p>
            <h3 class="text-2xl font-bold text-slate-900 pt-6">2. Behavior</h3>
            <p>Do not read questions out loud—this triggers the audio sensors. Keep your eyes on the screen.</p>
        `
    },
    {
        title: "From Failing to 98%: My Med-Surg Comeback",
        slug: "med-surg-success",
        category: "Success Story",
        imageIcon: "🏆",
        summary: "A case study on how Sarah used targeted Q/A guides to identify key symptoms and pass Medical-Surgical nursing.",
        content: `
            <p class="text-xl font-medium">Meet Sarah. She failed her first Med-Surg exam with a 62%. She thought she would drop out.</p>
            <h3 class="text-2xl font-bold text-slate-900 pt-6">The Solution</h3>
            <p>She stopped reading the 1000-page textbook and started using AvrilWriters' Targeted Q/A Guides to identify symptom clusters.</p>
            <h3 class="text-2xl font-bold text-slate-900 pt-6">The Result</h3>
            <p>She scored a 98% on her final and passed the class with flying colors.</p>
        `
    }
];

// Insert Data
const seedDB = async () => {
    await Post.deleteMany({}); // Clears old data first
    await Post.insertMany(articles);
    console.log("✅ Database Seeded with 5 Articles!");
};

seedDB().then(() => {
    mongoose.connection.close();
});