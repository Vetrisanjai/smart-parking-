const express = require('express');
const {
  createCheckoutSession,
  confirmDemoPayment,
  createRazorpayOrder,
  verifyRazorpayPayment,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/checkout/:bookingId', protect, createCheckoutSession);
router.post('/demo/:bookingId', protect, confirmDemoPayment);
router.post('/razorpay/order/:bookingId', protect, createRazorpayOrder);
router.post('/razorpay/verify', protect, verifyRazorpayPayment);

module.exports = router;
