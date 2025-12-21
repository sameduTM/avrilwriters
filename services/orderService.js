const Order = require('../models/orders');
const upload = require('../middlewares/upload');

class OrderService {
    static async createOrder(user, order, fileData) {
        try {
            const newOrder = await Order.create({
                userId: user.id,

                title: order.title,
                subject: order.subject,
                type: order.type,
                level: order.level,
                spacing: order.spacing,
                writerCategory: order.writerCategory,
                instructions: order.instructions,

                deadline: new Date(order.deadline),
                pages: parseInt(order.pages) || 0,
                price: parseInt(order.price) || 0,

                files: fileData,
            });

            return newOrder;
        } catch (err) {
            console.error("Order creation failed:", err);
            throw new Error("Could not create order");
        }
    }

    static async getOrderById(orderId) {
        try {
            const order = await Order.findById(orderId);
            return order;
        } catch (err) {
            console.error("OrderService Error:", err);
            return null;
        }
    }
    static async getOrdersByUserId(user, { status = 'all', page = 1, limit = 10 } = {}) {
        const query = { userId: user.id };

        if (status !== 'all') {
            query.status = status;
        }

        const skip = (page - 1) * limit;
        const totalOrders = await Order.countDocuments(query);

        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return {
            orders,
            currentPage: page,
            totalPages: Math.ceil(totalOrders / limit),
            statusFilter: status,
        };
    }
}

module.exports = OrderService;
