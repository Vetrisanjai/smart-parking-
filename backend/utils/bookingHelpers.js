const Booking = require('../models/Booking');

const hoursBetween = (start, end) => {
  const ms = new Date(end) - new Date(start);
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60)));
};

const calcAmount = (hourlyRate, startTime, endTime) =>
  hoursBetween(startTime, endTime) * hourlyRate;

const hasOverlap = async (slotId, startTime, endTime, excludeBookingId = null) => {
  const query = {
    slot: slotId,
    bookingStatus: { $nin: ['cancelled'] },
    paymentStatus: { $in: ['pending', 'paid'] },
    startTime: { $lt: new Date(endTime) },
    endTime: { $gt: new Date(startTime) },
  };
  if (excludeBookingId) query._id = { $ne: excludeBookingId };
  const conflict = await Booking.findOne(query);
  return !!conflict;
};

module.exports = { hoursBetween, calcAmount, hasOverlap };
