const Slot = require('../models/Slot');
const ParkingLot = require('../models/ParkingLot');
const Booking = require('../models/Booking');
const { hasOverlap } = require('../utils/bookingHelpers');

const getSlotsByLot = async (req, res) => {
  const slots = await Slot.find({ lot: req.params.lotId }).sort({ slotNumber: 1 });
  res.json(slots);
};

const createSlot = async (req, res) => {
  const lot = await ParkingLot.findById(req.body.lot);
  if (!lot) return res.status(404).json({ message: 'Lot not found' });
  const slot = await Slot.create(req.body);
  lot.totalSlots = await Slot.countDocuments({ lot: lot._id });
  await lot.save();
  res.status(201).json(slot);
};

const updateSlot = async (req, res) => {
  const slot = await Slot.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!slot) return res.status(404).json({ message: 'Slot not found' });
  res.json(slot);
};

const deleteSlot = async (req, res) => {
  const slot = await Slot.findByIdAndDelete(req.params.id);
  if (!slot) return res.status(404).json({ message: 'Slot not found' });
  const lot = await ParkingLot.findById(slot.lot);
  if (lot) {
    lot.totalSlots = await Slot.countDocuments({ lot: lot._id });
    await lot.save();
  }
  res.json({ message: 'Slot deleted' });
};

const getAvailableSlots = async (req, res) => {
  const { lotId, start, end } = req.query;
  if (!lotId || !start || !end) {
    return res.status(400).json({ message: 'lotId, start, and end are required' });
  }
  const startTime = new Date(start);
  const endTime = new Date(end);
  if (endTime <= startTime) {
    return res.status(400).json({ message: 'End time must be after start time' });
  }

  const slots = await Slot.find({
    lot: lotId,
    status: { $ne: 'maintenance' },
  });

  const available = [];
  for (const slot of slots) {
    const overlap = await hasOverlap(slot._id, startTime, endTime);
    if (!overlap) available.push(slot);
  }
  res.json(available);
};

module.exports = {
  getSlotsByLot,
  createSlot,
  updateSlot,
  deleteSlot,
  getAvailableSlots,
};
