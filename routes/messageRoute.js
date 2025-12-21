const express = require('express');
const MessageService = require('../services/messageService');
const Order = require('../models/orders');
const { requireLogin } = require('../middlewares/roleAuth');

const messageRouter = express.Router();

// middleware to ensure user is logged in
// messageRouter.use(requireLogin);

// POST: send a message
messageRouter.post('/messages/send', requireLogin, async (req, res) => {
    try {
        const { orderId, content } = req.body;
        const user = req.session.user;

        // Security Check: Ensure user belongs to this order
        const order = await Order.findById(orderId);
        if (!order) {
            req.flash('error', 'Order not found');
            return res.redirect('back');
        }

        const isOwner = order.userId.toString() === user.id.toString();
        const isWriter = order.writerId.toString() && order.writerId.toString() === user.id.toString();
        const isAdmin = user.role === 'admin';

        if (!isOwner && !isWriter && !isAdmin) {
            req.flash('error', 'Unauthorized to send messages in this order.');
            return res.redirect('back');
        }

        // Send Message
        await MessageService.sendMessage(user, orderId, content);

        // Redirect back to order page (reload to show new message)
        // If writer, go to writer view, else student view
        if (user.role === 'writer') {
            res.redirect(`/writer/orders/${orderId}`);
        } else if (user.role === 'admin') {
            res.redirect(`/admin/orders/${orderId}`);
        } else {
            res.redirect(`/orders/${orderId}`);
        }
    } catch (err) {
        console.error(err);
        req.flash('error', 'Failed to send message.');
        res.redirect('back');
    }
});

// GET: Check for new messages (API endpoint for polling)
messageRouter.get('/messages/api/check-messages', requireLogin, async (req, res) => {
    try {
        const { orderId } = req.query;
        const user = req.session.user;

        if (!orderId) {
            return res.json({ hasNewMessages: false });
        }

        // Get the order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.json({ hasNewMessages: false });
        }

        // Security Check: Ensure user has access to this order
        const isOwner = order.userId.toString() === user.id.toString();
        const isWriter = order.writerId?.toString() === user.id.toString();
        const isAdmin = user.role === 'admin';

        if (!isOwner && !isWriter && !isAdmin) {
            return res.json({ hasNewMessages: false });
        }

        // Get latest message timestamp from session (or use current time - 5 seconds)
        const lastCheckTime = req.session.lastMessageCheck || new Date(Date.now() - 5000);

        // Check if there are newer messages
        const Message = require('../models/message');
        const newMessages = await Message.findOne({
            orderId: orderId,
            createdAt: { $gt: lastCheckTime }
        }).sort({ createdAt: -1 });

        // Update last check time
        req.session.lastMessageCheck = new Date();

        res.json({
            hasNewMessages: !!newMessages,
            lastMessage: newMessages || null
        });
    } catch (err) {
        console.error('Error checking messages:', err);
        res.status(500).json({ hasNewMessages: false, error: err.message });
    }
});

// POST: Send message via JSON API (for AJAX)
messageRouter.post('/messages/api/send', requireLogin, async (req, res) => {
    try {
        const { orderId, content } = req.body;
        const user = req.session.user;

        // Validate
        if (!orderId || !content || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Missing orderId or content'
            });
        }

        // Security Check: Ensure user belongs to this order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const isOwner = order.userId.toString() === user.id.toString();
        const isWriter = order.writerId?.toString() === user.id.toString();
        const isAdmin = user.role === 'admin';

        if (!isOwner && !isWriter && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        // Send Message
        const message = await MessageService.sendMessage(user, orderId, content);

        res.json({
            success: true,
            message: message,
            content: 'Message sent successfully'
        });
    } catch (err) {
        console.error('Error sending message:', err);
        res.status(500).json({
            success: false,
            message: err.message || 'Failed to send message'
        });
    }
});

module.exports = messageRouter;
