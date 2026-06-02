require('dotenv').config();
const mongoose = require('mongoose');
const seedData = require('./seedData');

const seed = async () => {
  await mongoose.connect(
    process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_parking',
    { serverSelectionTimeoutMS: 10000 }
  );
  console.log('Connected to MongoDB');
  await seedData();
  console.log('\nSeed complete!');
  console.log('Admin login: admin@smartparking.com / admin123');
  process.exit(0);
};

seed().catch((err) => {
  if (err.name === 'MongooseServerSelectionError') {
    console.error('\nCould not connect to MongoDB.');
    console.error('Run the backend first (npm run dev) — it will use in-memory DB automatically.');
    console.error(`Or set MONGO_URI in backend/.env\n`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
