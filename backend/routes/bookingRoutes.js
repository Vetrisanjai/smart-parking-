const express = require('express');
const {
  createBooking,
  getMyBookings,
  getAllBookings,
  cancelBooking,
  getStats,
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', protect, authorize('admin'), getStats);
router.get('/mine', protect, getMyBookings);
router.get('/', protect, authorize('admin'), getAllBookings);
router.post('/', protect, createBooking);
router.patch('/:id/cancel', protect, cancelBooking);

module.exports = router;
