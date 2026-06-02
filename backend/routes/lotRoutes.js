const express = require('express');
const {
  getLots,
  getLot,
  createLot,
  updateLot,
  deleteLot,
} = require('../controllers/lotController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getLots);
router.get('/:id', protect, getLot);
router.post('/', protect, authorize('admin'), createLot);
router.put('/:id', protect, authorize('admin'), updateLot);
router.delete('/:id', protect, authorize('admin'), deleteLot);

module.exports = router;
