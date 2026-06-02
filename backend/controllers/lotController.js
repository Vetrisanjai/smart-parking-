const ParkingLot = require('../models/ParkingLot');
const Slot = require('../models/Slot');

const getLots = async (req, res) => {
  const filter = req.user?.role === 'admin' ? {} : { isActive: true };
  const lots = await ParkingLot.find(filter).sort({ createdAt: -1 });
  res.json(lots);
};

const getLot = async (req, res) => {
  const lot = await ParkingLot.findById(req.params.id);
  if (!lot) return res.status(404).json({ message: 'Lot not found' });
  res.json(lot);
};

const createLot = async (req, res) => {
  const lot = await ParkingLot.create(req.body);
  res.status(201).json(lot);
};

const updateLot = async (req, res) => {
  const lot = await ParkingLot.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!lot) return res.status(404).json({ message: 'Lot not found' });
  res.json(lot);
};

const deleteLot = async (req, res) => {
  const lot = await ParkingLot.findByIdAndDelete(req.params.id);
  if (!lot) return res.status(404).json({ message: 'Lot not found' });
  await Slot.deleteMany({ lot: lot._id });
  res.json({ message: 'Lot deleted' });
};

module.exports = { getLots, getLot, createLot, updateLot, deleteLot };
