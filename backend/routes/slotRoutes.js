const express = require('express');
const {
  getSlotsByLot,
  createSlot,
  updateSlot,
  deleteSlot,
  getAvailableSlots,
} = require('../controllers/slotController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/available', protect, getAvailableSlots);
router.get('/lot/:lotId', protect, getSlotsByLot);
router.post('/', protect, authorize('admin'), createSlot);
router.put('/:id', protect, authorize('admin'), updateSlot);
router.delete('/:id', protect, authorize('admin'), deleteSlot);

module.exports = router;
