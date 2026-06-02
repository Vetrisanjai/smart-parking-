const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema(
  {
    lot: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingLot', required: true },
    slotNumber: { type: String, required: true, trim: true },
    floor: { type: String, default: 'Ground' },
    status: {
      type: String,
      enum: ['available', 'occupied', 'maintenance'],
      default: 'available',
    },
  },
  { timestamps: true }
);

slotSchema.index({ lot: 1, slotNumber: 1 }, { unique: true });

module.exports = mongoose.model('Slot', slotSchema);
