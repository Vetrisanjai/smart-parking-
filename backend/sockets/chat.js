const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const { getConversationId } = require('../controllers/messageController');

const setupChat = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = await User.findById(decoded.id).select('-password');
      if (!socket.user) return next(new Error('User not found'));
      next();
    } catch {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user_${socket.user._id}`);

    socket.on('join_conversation', ({ conversationId }) => {
      if (conversationId) socket.join(conversationId);
    });

    socket.on('send_message', async ({ text, receiverId, conversationId }) => {
      try {
        if (!text?.trim()) return;

        let receiver;
        if (socket.user.role === 'admin') {
          receiver = await User.findById(receiverId);
        } else {
          receiver = await User.findOne({ role: 'admin' });
        }
        if (!receiver) return;

        const convId =
          conversationId || getConversationId(socket.user._id, receiver._id);

        const message = await Message.create({
          conversationId: convId,
          sender: socket.user._id,
          receiver: receiver._id,
          text: text.trim(),
        });

        const populated = await Message.findById(message._id)
          .populate('sender', 'name role')
          .populate('receiver', 'name role');

        io.to(convId).emit('new_message', populated);
        io.to(`user_${receiver._id}`).emit('notification', {
          conversationId: convId,
          preview: text.trim(),
        });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('mark_read', async ({ conversationId }) => {
      await Message.updateMany(
        { conversationId, receiver: socket.user._id, read: false },
        { read: true }
      );
      io.to(conversationId).emit('messages_read', { conversationId });
    });
  });
};

module.exports = setupChat;
