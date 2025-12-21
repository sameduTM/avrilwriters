const Message = require('../models/message');

class MessageService {
    /**
     * Send a new message
     */
    static async sendMessage(user, orderId, content) {
        if (!content || !content.trim()) throw new Error("Message cannot be empty");

        const message = new Message({
            orderId,
            senderId: user.id,
            senderName: user.name,
            content: content.trim(),
        });

        return await message.save();
    }

    /**
     * Get all messages for a specific order
     */
    static async getMessagesByOrder(orderId) {
        // Sort by oldest first (standard chat history)
        return await Message.find({ orderId }).sort({ createdAt: 1 });
    }
}

module.exports = MessageService;
