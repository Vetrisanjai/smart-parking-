const express = require('express');
const { askChatbot } = require('../controllers/chatbotController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/ask', protect, askChatbot);

module.exports = router;
