const express = require('express');
const upload = require('../middlewares/upload');
const Order = require('../models/orders');
const OrderService = require('../services/orderService');
// IMPORTANT: Import requireStudent to protect specific routes
const { requireStudent, requireLogin } = require('../middlewares/roleAuth');
const MessageService = require('../services/messageService');

const orderRouter = express.Router();

const IMAGE_PATHS = {
    logo: '/images/medical-team.png',
};

// Wrapper to catch "File Too Large" errors gracefully
const uploadMiddleware = (req, res, next) => {
    const uploadProcess = upload.array("files", 10);
    uploadProcess(req, res, (err) => {
        if (err) {
            console.error("Upload Error:", err);
            req.flash("error", err.message);
            return res.redirect('/place-order');
        }
        next();
    });
};

// =========================================================
// 1. STUDENT ONLY ROUTES (Protected by requireStudent)
// =========================================================

// GET Page: Place Order
orderRouter.get('/place-order', requireLogin, (req, res) => {
    res.render('place-order.html', {
        images: IMAGE_PATHS,
    });
});

// POST: Submit Order
orderRouter.post('/place-order', requireStudent, uploadMiddleware, async (req, res) => {
    try {
        const user = req.session.user;

        // Prepare file data
        let fileData = [];
        if (req.files && req.files.length > 0) {
            fileData = req.files.map(file => ({
                originalName: file.originalname,
                filename: file.filename,
                path: "/uploads/" + user.id + "/" + file.filename,
                size: file.size,
                mimetype: file.mimetype,
            }));
        }

        const newOrder = await OrderService.createOrder(user, req.body, fileData);

        req.flash("success", "Order placed successfully!");
        return res.redirect(`/orders/${newOrder._id}`);

    } catch (err) {
        console.error("Place Order Error:", err);
        req.flash("error", "Failed to place order. Please try again.");
        return res.redirect('/place-order');
    }
});

// GET: List My Orders
orderRouter.get('/orders', requireStudent, async (req, res) => {
    try {
        const user = req.session.user;
        const status = req.query.status || 'all';
        const page = parseInt(req.query.page) || 1;
        const limit = 10;

        const { orders, currentPage, totalPages, statusFilter } = await OrderService.getOrdersByUserId(user, {
            status,
            page,
            limit
        });

        res.render('my-orders.html', {
            user,
            orders,
            currentPage,
            totalPages,
            statusFilter,
            success: !!req.query.success,
            images: IMAGE_PATHS
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to load orders.");
    }
});

// =========================================================
// 2. SHARED ACCESS ROUTE (No requireStudent here)
// =========================================================

// GET: Single Order Details
// Accessible by: Owner (Student), Assigned Writer, or Admin
orderRouter.get('/orders/:id', async (req, res) => {
    try {
        // 1. Basic Login Check (We don't use requireStudent here so Admins/Writers can pass)
        if (!req.session.user) {
            req.flash('error', 'Please login first.');
            return res.redirect('/login');
        }

        const orderId = req.params.id;
        const user = req.session.user;

        // 2. Fetch Order
        const order = await OrderService.getOrderById(orderId);

        // ➕ FETCH MESSAGES
        const messages = await MessageService.getMessagesByOrder(orderId);

        if (!order) {
            req.flash('error', 'Order not found.');
            return res.redirect('/profile');
        }

        // 3. ACCESS CONTROL LOGIC
        const isOwner = order.userId.toString() === user.id.toString();
        // Check if current user is the assigned writer (safe check for null)
        const isAssignedWriter = order.writerId && (order.writerId.toString() === user.id.toString());
        const isAdmin = user.role === 'admin';

        // 4. Block Unauthorized Users
        if (!isOwner && !isAssignedWriter && !isAdmin) {
            req.flash('error', 'You are not authorized to view this order');
            // Redirect based on role to keep them in their dashboard
            if (user.role === 'admin') return res.redirect('/admin/dashboard');
            if (user.role === 'writer') return res.redirect('/writer/dashboard');
            return res.redirect('/profile');
        }

        // 5. Render Template
        // We pass flags so the template can show/hide buttons if needed
        res.render('order-details.html', {
            order,
            user,
            messages,
            isWriter: isAssignedWriter,
            isAdmin: isAdmin,
            images: IMAGE_PATHS,
        });

    } catch (err) {
        console.error("Error fetching order:", err);
        req.flash('error', 'Invalid Order ID.');
        res.redirect('/profile');
    }
});

// =========================================================
// API ENDPOINT: Place Order via App (with email notification)
// =========================================================
orderRouter.post('/orders/api/place-order', requireStudent, async (req, res) => {
    try {
        const user = req.session.user;
        const { subject, level, deadline, instructions } = req.body;

        // Validate required fields
        if (!subject || !deadline || !instructions) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: subject, deadline, instructions'
            });
        }

        // Create order in database
        const order = new Order({
            userId: user.id,
            title: subject,
            level: level || 'College',
            deadline: new Date(deadline),
            instructions: instructions,
            status: 'Pending',
            type: 'Assignment',
            subject: subject,
            pages: 1,
            spacing: 'Double Spaced',
            price: 0,
            writerCategory: 'Standard',
            files: [],
            createdAt: new Date()
        });

        await order.save();

        // Send email notification to admin/support
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER || 'prowriters1967@gmail.com',
                pass: process.env.EMAIL_PASSWORD || '' // Set via environment variable
            }
        });

        const emailContent = `
            <h2>New Order Received!</h2>
            <p><strong>Order ID:</strong> ${order._id}</p>
            <p><strong>Student Name:</strong> ${user.name}</p>
            <p><strong>Student Email:</strong> ${user.email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Academic Level:</strong> ${level || 'College'}</p>
            <p><strong>Deadline:</strong> ${deadline}</p>
            <p><strong>Instructions:</strong></p>
            <blockquote>${instructions.replace(/\n/g, '<br>')}</blockquote>
            <p><strong>Status:</strong> Pending Assignment</p>
            <p><a href="${process.env.APP_URL || 'http://localhost:3000'}/admin/order-details/${order._id}">View Order in Dashboard</a></p>
        `;

        await transporter.sendMail({
            from: process.env.EMAIL_USER || 'prowriters1967@gmail.com',
            to: 'prowriters1967@gmail.com',
            subject: `New Order: ${subject}`,
            html: emailContent
        });

        // Also send confirmation email to student
        await transporter.sendMail({
            from: process.env.EMAIL_USER || 'prowriters1967@gmail.com',
            to: user.email,
            subject: 'Order Received - We will be in touch shortly',
            html: `
                <h2>Thank you for your order!</h2>
                <p>Hi ${user.name},</p>
                <p>We've received your order and our team will review it shortly.</p>
                <p><strong>Order Details:</strong></p>
                <ul>
                    <li>Order ID: ${order._id}</li>
                    <li>Subject: ${subject}</li>
                    <li>Deadline: ${deadline}</li>
                </ul>
                <p>You'll receive a follow-up email with a quote and timeline within 24 hours.</p>
                <p>Best regards,<br>TutorsOnHenry Team</p>
            `
        });

        res.json({
            success: true,
            message: 'Order placed successfully!',
            orderId: order._id
        });

    } catch (err) {
        console.error('Error placing order via app:', err);
        res.status(500).json({
            success: false,
            message: err.message || 'Error processing order'
        });
    }
});

module.exports = orderRouter;