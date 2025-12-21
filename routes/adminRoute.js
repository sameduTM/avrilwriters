const express = require('express');
const Order = require('../models/orders');
const User = require('../models/user');
const { requireAdmin } = require('../middlewares/roleAuth');

const adminRouter = express.Router();

const IMAGE_PATHS = {
    logo: '/images/medical-team.png',
    hero: '',
}

adminRouter.use(requireAdmin);

// GET admin dashboard
adminRouter.get('/dashboard', async (req, res) => {
    try {
        // Fetch all orders - populate student and tutor details
        const orders = await Order.find()
            .populate('userId', 'name email')
            .populate('writerId', 'name')
            .sort({ createdAt: -1 })
            .limit(10);

        // fetch all writers (for the dropdown)
        const writers = await User.find({ role: 'writer' }).select('name _id');

        // ===== ANALYTICS CALCULATIONS =====
        
        // 1. Pending Count
        const pendingCount = await Order.countDocuments({ status: 'Pending' });

        // 2. Total Revenue (sum of all completed orders)
        const revenueResult = await Order.aggregate([
            { $match: { status: 'Completed' } },
            { $group: { _id: null, total: { $sum: '$price' } } }
        ]);
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

        // 3. Revenue Growth (last 30 days vs previous 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        const currentMonthRevenue = await Order.aggregate([
            { $match: { status: 'Completed', createdAt: { $gte: thirtyDaysAgo } } },
            { $group: { _id: null, total: { $sum: '$price' } } }
        ]);
        const previousMonthRevenue = await Order.aggregate([
            { $match: { status: 'Completed', createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } } },
            { $group: { _id: null, total: { $sum: '$price' } } }
        ]);

        const current = currentMonthRevenue.length > 0 ? currentMonthRevenue[0].total : 0;
        const previous = previousMonthRevenue.length > 0 ? previousMonthRevenue[0].total : 0;
        const revenueGrowth = previous > 0 ? Math.round(((current - previous) / previous) * 100) : 0;

        // 4. Order Completion Rate
        const totalOrders = await Order.countDocuments({});
        const completedOrders = await Order.countDocuments({ status: 'Completed' });
        const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

        // 5. Average Order Value
        const avgOrderResult = await Order.aggregate([
            { $group: { _id: null, average: { $avg: '$price' } } }
        ]);
        const avgOrderValue = avgOrderResult.length > 0 ? Math.round(avgOrderResult[0].average) : 0;

        // 6. Revenue Data (Last 30 days daily breakdown)
        const revenueData = [];
        const revenueDates = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);
            
            const dayRevenue = await Order.aggregate([
                { $match: { status: 'Completed', createdAt: { $gte: date, $lt: nextDate } } },
                { $group: { _id: null, total: { $sum: '$price' } } }
            ]);
            
            revenueData.push(dayRevenue.length > 0 ? dayRevenue[0].total : 0);
            revenueDates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }

        // 7. Signup Data (Last 7 days)
        const signupData = [];
        const signupDates = [];
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);
            
            const daySignups = await User.countDocuments({
                createdAt: { $gte: date, $lt: nextDate }
            });
            
            signupData.push(daySignups);
            signupDates.push(dayNames[date.getDay()]);
        }

        // 8. Order Status Distribution
        const statusDistribution = await Order.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        
        const statusData = [0, 0, 0]; // [Pending, InProgress, Completed]
        statusDistribution.forEach(item => {
            if (item._id === 'Pending') statusData[0] = item.count;
            if (item._id === 'In progress') statusData[1] = item.count;
            if (item._id === 'Completed') statusData[2] = item.count;
        });

        // 9. User Retention (6-week retention rate)
        const retentionData = [];
        for (let week = 1; week <= 6; week++) {
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - (week * 7));
            weekStart.setHours(0, 0, 0, 0);
            
            const weekEnd = new Date();
            weekEnd.setDate(weekEnd.getDate() - ((week - 1) * 7));
            
            const newUsersThisWeek = await User.countDocuments({
                createdAt: { $gte: weekStart, $lt: weekEnd }
            });
            
            // Calculate how many made at least one order
            const activeUsers = await Order.aggregate([
                { $match: { createdAt: { $gte: weekStart, $lt: weekEnd } } },
                { $group: { _id: '$userId' } },
                { $count: 'uniqueUsers' }
            ]);
            
            const activeCount = activeUsers.length > 0 ? activeUsers[0].uniqueUsers : 0;
            const retentionRate = newUsersThisWeek > 0 ? Math.round((activeCount / newUsersThisWeek) * 100) : 0;
            retentionData.unshift(retentionRate);
        }

        // 10. Total Users & Active/Inactive Breakdown
        const totalUsers = await User.countDocuments({ role: 'student' });
        const activeUsers = await Order.aggregate([
            { $group: { _id: '$userId' } },
            { $count: 'uniqueUsers' }
        ]);
        const activeUserCount = activeUsers.length > 0 ? activeUsers[0].uniqueUsers : 0;
        const inactiveUserCount = totalUsers - activeUserCount;

        // 11. Total Completed Orders & Revenue
        const completedOrdersResult = await Order.find({ status: 'Completed' }).select('price');
        const totalCompletedOrders = completedOrdersResult.length;
        const completedOrdersRevenue = completedOrdersResult.reduce((sum, order) => sum + order.price, 0);

        // 12. Average Response Time (days between order creation and writer assignment)
        const assignmentTimes = await Order.aggregate([
            { $match: { writerId: { $ne: null }, status: { $in: ['In progress', 'Completed'] } } },
            { $project: {
                assignmentTime: {
                    $divide: [
                        { $subtract: ['$updatedAt', '$createdAt'] },
                        1000 * 60 * 60 * 24 // Convert to days
                    ]
                }
            }},
            { $group: { _id: null, avgTime: { $avg: '$assignmentTime' } } }
        ]);
        const avgResponseTime = assignmentTimes.length > 0 ? Math.round(assignmentTimes[0].avgTime * 10) / 10 : 0;

        // 13. Monthly Recurring Revenue (MRR) - based on last 30 days average
        const mrrValue = Math.round(current / 30);

        // Compile analytics object
        const analytics = {
            totalRevenue: Math.round(totalRevenue),
            revenueGrowth,
            completionRate,
            avgOrderValue,
            totalUsers,
            activeUsers: activeUserCount,
            inactiveUsers: inactiveUserCount,
            totalCompletedOrders,
            completedOrdersRevenue: Math.round(completedOrdersRevenue),
            avgResponseTime,
            monthlyRecurringRevenue: mrrValue,
            revenueData: JSON.stringify(revenueData),
            revenueDates: JSON.stringify(revenueDates),
            signupData: JSON.stringify(signupData),
            signupDates: JSON.stringify(signupDates),
            statusData: JSON.stringify(statusData),
            retentionData: JSON.stringify(retentionData)
        };

        return res.render('admin/dashboard.html', {
            user: req.session.user,
            orders,
            writers,
            pendingCount,
            analytics,
            images: IMAGE_PATHS,
        });
    } catch (err) {
        console.error("Admin Dash Error:", err);
        res.redirect('/');
    }
});

// POST Assign Order
adminRouter.post('/assign-order', async (req, res) => {
    try {
        const { orderId, writerId } = req.body;

        if (!writerId) {
            req.flash('error', 'Please select a writer');
            return res.redirect(`/admin/order-details/${orderId}`);
        }

        await Order.findByIdAndUpdate(orderId, {
            writerId,
            status: 'In Progress',
        });

        req.flash('success', 'Writer successfully assigned');
        res.redirect(`/admin/order-details/${orderId}`);
    } catch (err) {
        console.error("Assignment Error:", err);
        req.flash('error', 'Failed to assign a writer');
        res.redirect('/admin/dashboard');
    }
});

adminRouter.get('/users', async (req, res) => {
    try {
        // fetch all users (newest first)
        const users = await User.find().select('-password').sort({ createdAt: -1 });

        res.render('admin/users.html', {
            user: req.session.user,
            users,
            images: IMAGE_PATHS,
        });
    } catch (err) {
        console.error("Admin Users Page Error:", err);
        req.flash('error', 'Could not load user list.');
        res.redirect('/admin/dashboard');
    }
});

adminRouter.post('/update-role', async (req, res) => {
    try {
        const { targetUserId, newRole } = req.body;
        const currentAdminId = req.session.user._id || req.session.user.id;

        // prevent self-lockout
        if (targetUserId === currentAdminId.toString()) {
            req.flash('error', 'You cannot change your own role');
            return res.redirect('/admin/users');
        }

        await User.findByIdAndUpdate(targetUserId, { role: newRole });

        req.flash('success', 'User role updated successfully.');
        res.redirect('/admin/users');

    } catch (err) {
        console.error("Role Update Error:", err);
        req.flash('error', 'Failed to update role.');
        res.redirect('/admin/users');
    }
});


// GET Single Order Details (Admin View)
adminRouter.get('/orders/:id', async (req, res) => {
    try {
        const orderId = req.params.id;

        // fetch order & populate users
        const order = await Order.findById(orderId)
            .populate('userId', 'name email')
            .populate('writerId', 'name email');
        
        const writers = await User.find({ role: 'writer' });
        
        if (!order) {
            req.flash('error', 'Order not found.');
            return res.redirect('/admin/dashboard');
        }

        // render template
        res.render('admin/order-details.html', {
            order,
            writers,
            user: req.session.user,
            images: IMAGE_PATHS,
        });
    } catch (err) {
        console.error("Error fetching order:", err);
        req.flash('error', 'Invalid Order ID.');
        res.redirect('/admin/dashboard');
    }
});

// GET Analytics & Reports Page
adminRouter.get('/analytics', async (req, res) => {
    try {
        // Fetch analytics data similar to dashboard
        const orders = await Order.find().sort({ createdAt: -1 }).limit(100);
        const totalOrders = await Order.countDocuments({});
        const completedOrders = await Order.countDocuments({ status: 'Completed' });
        const pendingOrders = await Order.countDocuments({ status: 'Pending' });
        const inProgressOrders = await Order.countDocuments({ status: 'In progress' });

        // Revenue metrics
        const revenueResult = await Order.aggregate([
            { $match: { status: 'Completed' } },
            { $group: { _id: null, total: { $sum: '$price' } } }
        ]);
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

        // Top performing writers
        const topWriters = await Order.aggregate([
            { $match: { writerId: { $ne: null }, status: 'Completed' } },
            { $group: { _id: '$writerId', completedCount: { $sum: 1 }, totalEarnings: { $sum: '$price' } } },
            { $sort: { completedCount: -1 } },
            { $limit: 10 },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'writerInfo' } }
        ]);

        // Monthly revenue trend
        const monthlyRevenue = [];
        for (let i = 11; i >= 0; i--) {
            const monthStart = new Date();
            monthStart.setMonth(monthStart.getMonth() - i);
            monthStart.setDate(1);
            monthStart.setHours(0, 0, 0, 0);

            const monthEnd = new Date();
            monthEnd.setMonth(monthEnd.getMonth() - i + 1);
            monthEnd.setDate(1);
            monthEnd.setHours(0, 0, 0, 0);

            const monthData = await Order.aggregate([
                { $match: { status: 'Completed', createdAt: { $gte: monthStart, $lt: monthEnd } } },
                { $group: { _id: null, total: { $sum: '$price' } } }
            ]);

            monthlyRevenue.push({
                month: monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
                revenue: monthData.length > 0 ? monthData[0].total : 0
            });
        }

        res.render('admin/analytics.html', {
            user: req.session.user,
            orders,
            totalOrders,
            completedOrders,
            pendingOrders,
            inProgressOrders,
            totalRevenue,
            topWriters,
            monthlyRevenue: JSON.stringify(monthlyRevenue.map(m => m.revenue)),
            monthLabels: JSON.stringify(monthlyRevenue.map(m => m.month)),
            images: IMAGE_PATHS,
        });
    } catch (err) {
        console.error("Analytics Page Error:", err);
        req.flash('error', 'Could not load analytics.');
        res.redirect('/admin/dashboard');
    }
});

// GET Financial Management Page
adminRouter.get('/financial', async (req, res) => {
    try {
        // Fetch financial data
        const completedOrders = await Order.find({ status: 'Completed' }).select('price writerId createdAt');
        const totalRevenue = completedOrders.reduce((sum, order) => sum + order.price, 0);

        // Writer earnings
        const writerEarnings = await Order.aggregate([
            { $match: { writerId: { $ne: null }, status: 'Completed' } },
            { $group: { _id: '$writerId', earnings: { $sum: '$price' }, orderCount: { $sum: 1 } } },
            { $sort: { earnings: -1 } },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'writerInfo' } }
        ]);

        // Platform breakdown
        const platformTake = Math.round(totalRevenue * 0.2); // Assuming 20% platform fee
        const writerPayouts = totalRevenue - platformTake;

        // Recent transactions
        const recentTransactions = completedOrders
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 20)
            .map(order => ({
                orderId: order._id,
                amount: order.price,
                writerId: order.writerId,
                date: order.createdAt,
                platformFee: Math.round(order.price * 0.2),
                writerPayout: Math.round(order.price * 0.8)
            }));

        res.render('admin/financial.html', {
            user: req.session.user,
            totalRevenue,
            platformTake,
            writerPayouts,
            writerEarnings,
            recentTransactions,
            images: IMAGE_PATHS,
        });
    } catch (err) {
        console.error("Financial Page Error:", err);
        req.flash('error', 'Could not load financial data.');
        res.redirect('/admin/dashboard');
    }
});

// GET Activity Logs Page
adminRouter.get('/activity', async (req, res) => {
    try {
        // Fetch recent orders as activity
        const activityLogs = await Order.find()
            .populate('userId', 'name email')
            .populate('writerId', 'name')
            .sort({ updatedAt: -1 })
            .limit(50);

        const formattedLogs = activityLogs.map(order => ({
            id: order._id,
            action: `Order #${order._id.toString().slice(-6)} - ${order.status}`,
            actor: order.userId?.name || 'Unknown Student',
            timestamp: order.updatedAt,
            details: `${order.title} assigned to ${order.writerId?.name || 'Unassigned'}`,
            type: order.status === 'Completed' ? 'success' : order.status === 'Pending' ? 'warning' : 'info'
        }));

        res.render('admin/activity.html', {
            user: req.session.user,
            activityLogs: formattedLogs,
            images: IMAGE_PATHS,
        });
    } catch (err) {
        console.error("Activity Logs Error:", err);
        req.flash('error', 'Could not load activity logs.');
        res.redirect('/admin/dashboard');
    }
});

// GET Messages & Support Page
adminRouter.get('/messages', async (req, res) => {
    try {
        // Placeholder for message/ticket system
        const messages = [];
        
        res.render('admin/messages.html', {
            user: req.session.user,
            messages,
            images: IMAGE_PATHS,
        });
    } catch (err) {
        console.error("Messages Page Error:", err);
        req.flash('error', 'Could not load messages.');
        res.redirect('/admin/dashboard');
    }
});

// GET System Settings Page
adminRouter.get('/settings', async (req, res) => {
    try {
        // Placeholder for system settings
        const settings = {
            platformName: 'Tutorsonhenry',
            platformFee: 20,
            maxOrderDuration: 30,
            supportEmail: 'support@tutorsonhenry.com'
        };

        res.render('admin/settings.html', {
            user: req.session.user,
            settings,
            images: IMAGE_PATHS,
        });
    } catch (err) {
        console.error("Settings Page Error:", err);
        req.flash('error', 'Could not load settings.');
        res.redirect('/admin/dashboard');
    }
});

module.exports = adminRouter;
