const express = require('express');
const OrderService = require('../services/orderService');
const { requireStudent } = require('../middlewares/roleAuth');
const UserService = require('../services/userService');
const User = require('../models/user');
// ✅ IMPORT ORDER AND MESSAGE MODELS
const Order = require('../models/orders');
const Message = require('../models/message');

const userRouter = express.Router();

const IMAGE_PATHS = {
    logo: '/images/medical-team.png',
    hero: '/images/hero-bg.jpg',
    favicon: '/images/favicon.png',
}

userRouter.get('/', async (req, res) => {
    const {
        proctoredExams,
        onlineExams,
        atiModules,
        onlineClasses,
    } = await UserService.getAllServices();

    res.render('index.html', {
        images: IMAGE_PATHS, proctoredExams, onlineExams, atiModules, onlineClasses,
    });
});

userRouter.get('/refund-policy', (req, res) => {
    res.render('refund-policy.html', {
        images: IMAGE_PATHS,
    });
});

userRouter.get('/privacy-policy', (req, res) => {
    res.render('privacy-policy.html', {
        images: IMAGE_PATHS,
    });
});

userRouter.get('/place-order-social', (req, res) => {
    res.render('place-order-social.html', {
        images: IMAGE_PATHS,
    });
});

userRouter.get('/guides', (req, res) => {
    res.render('guides.html', {
        images: IMAGE_PATHS,
    });
});


userRouter.get('/signup', (req, res) => {
    res.render('sign-up.html', {
        images: IMAGE_PATHS,
    });
});

userRouter.post('/signup', async (req, res, next) => {
    try {
        const userData = req.body;
        const { password, email, name } = userData;

        if (!password || password.length < 8) {
            req.flash('error', 'Password must be at least 8 characters long.');
            return res.status(400).render('sign-up.html', {
                images: IMAGE_PATHS,
                error: 'Password must be at least 8 characters long.',
                values: { name, email },
            });
        }

        const user = await UserService.createUser(userData);

        req.flash('success', 'Account created! Please log in.');
        res.status(201).redirect('/login');

    } catch (err) {
        console.error('Signup error:', err);
        let errorMessage = "Signup failed. Please try again.";
        let statusCode = 500;

        if (err.code === 11000) {
            errorMessage = 'That email is already registered. Please login.';
            req.flash('error', 'Email already registered');
            statusCode = 400;
        }

        return res.status(statusCode).render('sign-up.html', {
            images: IMAGE_PATHS,
            error: errorMessage,
            values: req.body,
        });
    }
});

// ✅ UPDATED MESSAGES ROUTE
userRouter.get('/messages', requireStudent, async (req, res) => {
    const user = req.session.user;
    const selectedOrderId = req.query.orderId; // Get ID from URL query (?orderId=...)

    if (!user) return res.redirect('/login');

    try {
        // 1. Fetch all active orders for the sidebar list
        // Filter: Only show orders that belong to this user
        const conversations = await Order.find({ userId: user.id })
            .sort({ updatedAt: -1 }) // Sort by most recent
            .select('title status _id writerId');

        // 2. If an order is selected, fetch its messages
        let currentOrder = null;
        let messages = [];

        if (selectedOrderId) {
            // Find the specific order in our list (security check included)
            currentOrder = conversations.find(o => o._id.toString() === selectedOrderId);

            if (currentOrder) {
                // Fetch chat history for this order
                messages = await Message.find({ orderId: selectedOrderId })
                    .sort({ createdAt: 1 }); // Oldest first
            }
        }

        // 3. Render the view with all necessary data
        res.render('messages.html', {
            images: IMAGE_PATHS,
            user,
            conversations, // The list for the sidebar
            currentOrder,  // The active chat (if any)
            messages,      // The chat history
            csrfToken: req.csrfToken ? req.csrfToken() : (res.locals.csrfToken || '') // Handle CSRF safely
        });

    } catch (err) {
        console.error("Messages Page Error:", err);
        req.flash('error', 'Could not load messages.');
        res.redirect('/profile');
    }
});

userRouter.get('/topup', requireStudent, (req, res) => {
    const user = req.session.user;
    if (!user) return res.redirect('/login');

    res.render('topup.html', {
        images: IMAGE_PATHS,
        user,
    })
});

userRouter.get('/profile', requireStudent, async (req, res) => {
    const sessionUser = req.session.user;

    if (!sessionUser) return res.redirect('/login');

    try {
        const currentUser = await User.findById(sessionUser.id);
        const pendingCount = await Order.countDocuments({ userId: sessionUser.id, status: 'Pending' });
        const inProgressCount = await Order.countDocuments({ userId: sessionUser.id, status: 'In Progress' });
        const completedCount = await Order.countDocuments({ userId: sessionUser.id, status: 'Completed' });
        const cancelledCount = await Order.countDocuments({ userId: sessionUser.id, status: 'Cancelled' });
        const biddingCount = await Order.countDocuments({ userId: sessionUser.id, status: 'Bidding' });
        const totalOrders = await Order.countDocuments({ userId: sessionUser.id });

        // Get total spent on completed orders
        const completedOrders = await Order.find({ userId: sessionUser.id, status: 'Completed' });
        const totalSpent = completedOrders.reduce((sum, order) => sum + (order.price || 0), 0);

        // Get recent 5 orders
        const recentOrders = await Order.find({ userId: sessionUser.id })
            .populate('writerId', 'name')
            .sort({ createdAt: -1 })
            .limit(5);

        const ordersData = await OrderService.getOrdersByUserId(sessionUser);

        res.render('profile.html', {
            user: currentUser,
            images: IMAGE_PATHS,
            orders: ordersData.orders || [],
            recentOrders: recentOrders,
            currentPage: ordersData.currentPage,
            totalPages: ordersData.totalPages,
            stats: {
                pending: pendingCount,
                inProgress: inProgressCount,
                completed: completedCount,
                cancelled: cancelledCount,
                biddingOrders: biddingCount || pendingCount,
                approved: completedCount,
                total: totalOrders,
                totalSpent: totalSpent,
            },
        });
    } catch (err) {
        console.error("Profile Error:", err);
        res.redirect('/');
    }
});

module.exports = userRouter;