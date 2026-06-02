const User = require('../models/User');
const ParkingLot = require('../models/ParkingLot');
const Slot = require('../models/Slot');

const seedData = async () => {
  let admin = await User.findOne({ email: 'admin@smartparking.com' });
  if (!admin) {
    admin = await User.create({
      name: 'System Admin',
      email: 'admin@smartparking.com',
      password: 'admin123',
      role: 'admin',
    });
    console.log('Admin created: admin@smartparking.com / admin123');
  }

  let customer = await User.findOne({ email: 'customer@smartparking.com' });
  if (!customer) {
    customer = await User.create({
      name: 'John Customer',
      email: 'customer@smartparking.com',
      password: 'customer123',
      role: 'customer',
      phone: '9876543210',
      vehiclePlate: 'MH12AB1234',
    });
    console.log('Customer created: customer@smartparking.com / customer123');
  }

  let lot = await ParkingLot.findOne({ name: 'Central Plaza Parking' });
  if (!lot) {
    lot = await ParkingLot.create({
      name: 'Central Plaza Parking',
      address: '123 Main Street, Downtown',
      hourlyRate: 5,
      description: 'Covered parking near city center',
      totalSlots: 0,
    });
    console.log('Parking lot created');
  }

  const slotCount = await Slot.countDocuments({ lot: lot._id });
  if (slotCount === 0) {
    const slots = [];
    for (let i = 1; i <= 12; i++) {
      slots.push({
        lot: lot._id,
        slotNumber: `A-${String(i).padStart(2, '0')}`,
        floor: 'Ground',
        status: 'available',
      });
    }
    await Slot.insertMany(slots);
    lot.totalSlots = 12;
    await lot.save();
    console.log('12 slots created');
  }
};

module.exports = seedData;
