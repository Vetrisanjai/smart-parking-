const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const ParkingLot = require('../models/ParkingLot');
const { calcAmount, hasOverlap } = require('../utils/bookingHelpers');

const createBooking = async (req, res) => {
  const { slotId, startTime, endTime, vehiclePlate } = req.body;
  const slot = await Slot.findById(slotId).populate('lot');
  if (!slot) return res.status(404).json({ message: 'Slot not found' });
  if (slot.status === 'maintenance') {
    return res.status(400).json({ message: 'Slot is under maintenance' });
  }

  const start = new Date(startTime);
  const end = new Date(endTime);
  if (end <= start) {
    return res.status(400).json({ message: 'End time must be after start time' });
  }

  const overlap = await hasOverlap(slot._id, start, end);
  if (overlap) {
    return res.status(400).json({ message: 'Slot already booked for this time' });
  }

  const lot = await ParkingLot.findById(slot.lot._id || slot.lot);
  const amount = calcAmount(lot.hourlyRate, start, end);

  const booking = await Booking.create({
    user: req.user._id,
    slot: slot._id,
    lot: lot._id,
    startTime: start,
    endTime: end,
    vehiclePlate: vehiclePlate || req.user.vehiclePlate || '',
    amount,
    paymentStatus: 'pending',
    bookingStatus: 'pending',
  });

  const populated = await Booking.findById(booking._id)
    .populate('slot', 'slotNumber floor')
    .populate('lot', 'name address hourlyRate');

  res.status(201).json(populated);
};

const getMyBookings = async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
    .populate('slot', 'slotNumber floor')
    .populate('lot', 'name address')
    .sort({ createdAt: -1 });
  res.json(bookings);
};

const getAllBookings = async (req, res) => {
  const bookings = await Booking.find()
    .populate('user', 'name email phone')
    .populate('slot', 'slotNumber')
    .populate('lot', 'name')
    .sort({ createdAt: -1 });
  res.json(bookings);
};

const cancelBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });

  const isOwner = booking.user.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  if (booking.bookingStatus === 'cancelled') {
    return res.status(400).json({ message: 'Already cancelled' });
  }

  booking.bookingStatus = 'cancelled';
  if (booking.paymentStatus === 'pending') {
    booking.paymentStatus = 'failed';
  }
  await booking.save();
  res.json(booking);
};

const getStats = async (req, res) => {
  const [totalBookings, paidBookings, customers, lots, slots] = await Promise.all([
    Booking.countDocuments(),
    Booking.countDocuments({ paymentStatus: 'paid' }),
    require('../models/User').countDocuments({ role: 'customer' }),
    ParkingLot.countDocuments(),
    Slot.countDocuments(),
  ]);

  const revenue = await Booking.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayBookings = await Booking.countDocuments({
    createdAt: { $gte: today },
    paymentStatus: 'paid',
  });

  res.json({
    totalBookings,
    paidBookings,
    customers,
    lots,
    slots,
    revenue: revenue[0]?.total || 0,
    todayBookings,
  });
};

module.exports = {
  createBooking,
  getMyBookings,
  getAllBookings,
  cancelBooking,
  getStats,
};
