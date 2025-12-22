const express = require('express');
const Order = require('../models/orders');
const { requireWriter } = require('../middlewares/roleAuth'); // Ensure this matches your export name (requireTutor or requireWriter)
const MessageService = require('../services/messageService');
const Post = require('../models/post');

const writerRouter = express.Router();

// Apply middleware
writerRouter.use(requireWriter);

const IMAGE_PATHS = {
    logo: '/images/medical-team.png',
    hero: '',
}

// ==========================================
// BLOG MANAGEMENT ROUTES
// ==========================================

// 1. LIST all blog posts
writerRouter.get('/blog', async (req, res) => {
    try {
        const posts = await Post.find({}).sort({ date: -1 });
        res.render('writer/blog-list.html', {
            posts,
            user: req.session.user,
            images: IMAGE_PATHS,
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Could not load blod posts');
        res.redirect('/writer/dashboard');
    }
});

// 2. SHOW CREATE FORM
writerRouter.get('/blog/new', (req, res) => {
    res.render('writer/blog-editor.html', {
        post: null,
        user: req.session.user,
    });
});

// 3. SHOW EDIT FORM
writerRouter.get('/blog/edit/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            req.flash('error', 'Post not found');
            return res.redirect('/writer/blog');
        }
        res.render('writer/blog-editor.html', {
            post,
            user: req.session.user,
        });
    } catch (err) {
        console.error('Post Not Found Error:', err);
        req.flash('error', 'Invalid Post ID');
        res.redirect('/writer/blog');
    }
});

// 4. CREATE POST
writerRouter.post('/blog/create', async (req, res) => {
    try {
        await Post.create(req.body);
        req.flash('success', 'Article published successfully!');
        res.redirect('/writer/blog');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error creating post (Slug might be duplicate)');
        res.redirect('/writer/blog/new');
    }
});

// 5. UPDATE POST
writerRouter.post('/blog/update/:id', async (req, res) => {
    try {
        await Post.findByIdAndUpdate(req.params.id, req.body);
        req.flash('success', 'Article updated!');
        res.redirect('/writer/blog');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Update failed');
        res.redirect('/writer/blog');
    }
});

// 6. DELETE POST
writerRouter.post('/blog/delete/:id', async (req, res) => {
    try {
        await Post.findByIdAndDelete(req.params.id);
        req.flash('success', 'Article deleted');
        res.redirect('/writer/blog');
    } catch (err) {
        req.flash('error', 'Delete failed');
        res.redirect('/writer/blog');
    }
});

// GET: Writer Dashboard
writerRouter.get('/dashboard', async (req, res) => {
    try {
        const currentWriterId = req.session.user.id;

        // Find orders assigned to this writer
        const myOrders = await Order.find({
            writerId: currentWriterId,
            status: { $in: ['In Progress', 'Completed'] }
        })
            .populate('userId', 'name email')
            .sort({ deadline: 1 });

        // Calculate statistics
        const activeOrders = await Order.countDocuments({
            writerId: currentWriterId,
            status: 'In Progress'
        });

        const completedOrders = await Order.find({
            writerId: currentWriterId,
            status: 'Completed'
        });

        const totalEarnings = completedOrders.reduce((sum, order) => sum + (order.price || 0), 0);

        // Available jobs for claiming
        const availableJobs = await Order.countDocuments({
            writerId: null,
            status: { $in: ['Pending', 'Bidding'] }
        });

        // Calculate earnings for current month
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEarnings = completedOrders
            .filter(order => new Date(order.createdAt) >= monthStart)
            .reduce((sum, order) => sum + (order.price || 0), 0);

        // Calculate success rate (completed / total)
        const totalOrders = await Order.countDocuments({ writerId: currentWriterId });
        const successRate = totalOrders > 0 ? Math.round((completedOrders.length / totalOrders) * 100) : 0;

        // Get recent completed orders for activity
        const recentCompleted = completedOrders.slice(0, 5);

        res.render('writer/dashboard.html', {
            user: req.session.user,
            orders: myOrders,
            stats: {
                active: activeOrders,
                available: availableJobs,
                total: totalEarnings,
                monthEarnings: monthEarnings,
                successRate: successRate,
                completed: completedOrders.length,
            },
            recentCompleted: recentCompleted,
            images: IMAGE_PATHS,
        });

    } catch (err) {
        console.error("Writer Dash Error:", err);
        req.flash('error', 'Could not load dashboard.');
        res.redirect('/');
    }
});

// POST: Update Order Status
// FIX: Changed route from '/update-order' to '/update-status' to match the HTML Form
writerRouter.post('/update-status', async (req, res) => {
    try {
        const { orderId, newStatus } = req.body;
        const currentWriterId = req.session.user.id;

        // FIX: Use findOneAndUpdate when querying by multiple fields (id + writerId)
        const order = await Order.findOneAndUpdate(
            { _id: orderId, writerId: currentWriterId },
            { status: newStatus },
            { new: true },
        );

        if (!order) {
            req.flash('error', 'Order not found or unauthorized');
            return res.redirect('/writer/dashboard');
        }

        req.flash('success', `Order #${order._id.toString().slice(-6)} marked as ${newStatus}.`);
        res.redirect('/writer/dashboard'); // Ensure we redirect back to refresh the page

    } catch (err) {
        console.error("Status Update Error:", err);
        req.flash('error', 'Failed to update status.');
        res.redirect('/writer/dashboard');
    }
});

// GET Single Order Details (Writer View)
writerRouter.get('/orders/:id', async (req, res) => {
    try {
        const orderId = req.params.id;
        const writerId = req.session.user.id;

        // 1. Fetch Order
        const order = await Order.findById(orderId)
            .populate('userId', 'name');

        // ➕ FETCH MESSAGES
        const messages = await MessageService.getMessagesByOrder(orderId);

        if (!order) {
            req.flash('error', 'Order not found.');
            return res.redirect('/writer/dashboard');
        }

        // 2. SECURITY: Verify Access
        // Writers can view an order ONLY if:
        // A) They are already assigned to it
        // B) The order is available for bidding

        const isAssigned = order.writerId && order.writerId.toString() === writerId;
        const isOpenForBidding = order.status === 'Bidding' || order.status === 'Pending';

        if (!isAssigned && !isOpenForBidding) {
            req.flash('error', 'You do not have permission to view this order.');
            return res.redirect('/writer/dashboard');
        }

        // 3. Render Template
        res.render('writer/order-details.html', {
            order,
            user: req.session.user,
            messages,
            isWriter: true,
            isAssigned: isAssigned,
            images: IMAGE_PATHS
        });

    } catch (err) {
        console.error("Writer Order View Error:", err);
        req.flash('error', 'Invalid Order ID.');
        res.redirect('/writer/dashboard');
    }
});

writerRouter.get('/earnings', async (req, res) => {
    try {
        const currentWriterId = req.session.user.id;

        // fetch all COMPLETED orders for this writer
        const completeOrders = await Order.find({
            writerId: currentWriterId,
            status: 'Completed',
        }).sort({ updatedAt: -1 });

        // calculate total earnings - reduce array of orders to single sum
        const totalEarnings = completeOrders.reduce((sum, order) => sum + (order.price || 0), 0);

        // calculate pending (orders in progress)
        const activeOrders = await Order.find({
            writerId: currentWriterId,
            status: 'In progress',
        });
        const pendingEarnings = activeOrders.reduce((sum, order) => sum + (order.price || 0), 0);

        res.render('writer/earnings.html', {
            user: req.session.user,
            completeOrders,
            stats: {
                active: activeOrders,
                total: totalEarnings,
                pending: pendingEarnings,
                count: completeOrders.length,
            },
            images: IMAGE_PATHS,
        });
    } catch (err) {
        console.error("Writer Earnings Error", err);
        req.flash('error', 'Could not load earnings data.');
        res.redirect('/writer/dashboard');
    }
});

writerRouter.post('/request-payout', (req, res) => {
    try {
        const amount = req.flash('success', `Payout request for $${amount} submitted successfully. Admin will review.`);
        req.redirect('/writer/earnings');
    } catch (err) {
        console.error("Payout Error:", err);
        res.redirect('/writer/earnings');
    }
});

// 1. GET: Browse Available Jobs
// Shows orders with status 'Bidding' (or 'Pending' depending on your workflow)
writerRouter.get('/available', async (req, res) => {
    try {
        const availableOrders = await Order.find({
            status: { $in: ['Pending', 'Bidding'] },
            writerId: null, // ensure no one else has taken it
        })
            .populate('userId', 'name')
            .sort({ deadline: 1 }); // urgent jobs first

        res.render('writer/available.html', {
            user: req.session.user,
            orders: availableOrders,
            images: IMAGE_PATHS,
        });
    } catch (err) {
        console.error("Writer Available Error:", err);
        req.flash('error', 'Could not load available jobs.');
        res.redirect('/writer/dashboard');
    }
});

// POST: Bid on an Order
writerRouter.post('/bid', async (req, res) => {
    try {
        const { orderId } = req.body;
        const currentWriterId = req.session.user.id;

        // Instant Claim
        const order = await Order.findOneAndUpdate(
            { _id: orderId, writerId: null },
            { writerId: currentWriterId, status: 'In progress' },
            { new: true },
        );

        if (!order) {
            req.flash('error', 'This order is no longer available.');
        } else {
            req.flash('success', 'You have successfully claimed this order!');
        }

        res.redirect('/writer/available');
    } catch (err) {
        console.error("Bidding Error:", err);
        req.flash('error', 'Failed to place bid');
        res.redirect('/writer/available');
    }
});

module.exports = writerRouter;
