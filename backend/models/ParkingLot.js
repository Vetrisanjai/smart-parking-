const mongoose = require('mongoose');

const parkingLotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    totalSlots: { type: Number, default: 0 },
    hourlyRate: { type: Number, required: true, min: 0 },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ParkingLot', parkingLotSchema);
