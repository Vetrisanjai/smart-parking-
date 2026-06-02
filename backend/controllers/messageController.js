const Message = require('../models/Message');
const User = require('../models/User');

const getConversationId = (userId, adminId) => {
  const ids = [userId.toString(), adminId.toString()].sort();
  return `conv_${ids[0]}_${ids[1]}`;
};

const getAdmin = async () => User.findOne({ role: 'admin' }).sort({ createdAt: 1 });

const getMessages = async (req, res) => {
  const admin = await getAdmin();
  if (!admin) {
    return res.status(404).json({ message: 'No admin available' });
  }

  let conversationId;
  if (req.user.role === 'admin') {
    const customerId = req.params.userId || req.query.userId;
    if (!customerId) {
      return res.status(400).json({ message: 'userId required for admin' });
    }
    conversationId = getConversationId(customerId, req.user._id);
  } else {
    conversationId = getConversationId(req.user._id, admin._id);
  }

  const messages = await Message.find({ conversationId })
    .populate('sender', 'name role')
    .populate('receiver', 'name role')
    .sort({ createdAt: 1 });

  res.json({ conversationId, adminId: admin._id, messages });
};

const getConversations = async (req, res) => {
  const messages = await Message.find({
    $or: [{ sender: req.user._id }, { receiver: req.user._id }],
  })
    .populate('sender', 'name email role')
    .populate('receiver', 'name email role')
    .sort({ createdAt: -1 });

  const map = new Map();
  for (const msg of messages) {
    const other =
      msg.sender._id.toString() === req.user._id.toString() ? msg.receiver : msg.sender;
    if (!map.has(other._id.toString())) {
      map.set(other._id.toString(), {
        user: other,
        conversationId: msg.conversationId,
        lastMessage: msg.text,
        updatedAt: msg.createdAt,
        unread: 0,
      });
    }
  }

  const list = Array.from(map.values());
  for (const conv of list) {
    conv.unread = await Message.countDocuments({
      conversationId: conv.conversationId,
      receiver: req.user._id,
      read: false,
    });
  }

  res.json(list);
};

const sendMessage = async (req, res) => {
  const { text, receiverId } = req.body;
  if (!text?.trim()) {
    return res.status(400).json({ message: 'Text is required' });
  }

  let receiver;
  if (req.user.role === 'admin') {
    if (!receiverId) {
      return res.status(400).json({ message: 'receiverId required' });
    }
    receiver = await User.findById(receiverId);
  } else {
    receiver = await getAdmin();
  }

  if (!receiver) {
    return res.status(404).json({ message: 'Receiver not found' });
  }

  const conversationId = getConversationId(req.user._id, receiver._id);
  const message = await Message.create({
    conversationId,
    sender: req.user._id,
    receiver: receiver._id,
    text: text.trim(),
  });

  const populated = await Message.findById(message._id)
    .populate('sender', 'name role')
    .populate('receiver', 'name role');

  res.status(201).json(populated);
};

const markRead = async (req, res) => {
  const { conversationId } = req.body;
  await Message.updateMany(
    { conversationId, receiver: req.user._id, read: false },
    { read: true }
  );
  res.json({ message: 'Marked as read' });
};

const getCustomers = async (req, res) => {
  const customers = await User.find({ role: 'customer' }).select('name email phone');
  res.json(customers);
};

module.exports = {
  getMessages,
  getConversations,
  sendMessage,
  markRead,
  getCustomers,
  getConversationId,
};
