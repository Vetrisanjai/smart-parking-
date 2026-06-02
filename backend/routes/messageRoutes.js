const express = require('express');
const {
  getMessages,
  getConversations,
  sendMessage,
  markRead,
  getCustomers,
} = require('../controllers/messageController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/conversations', protect, getConversations);
router.get('/customers', protect, authorize('admin'), getCustomers);
router.get('/user/:userId', protect, authorize('admin'), getMessages);
router.get('/', protect, getMessages);
router.post('/', protect, sendMessage);
router.patch('/read', protect, markRead);

module.exports = router;
