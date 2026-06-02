const mongoose = require('mongoose');

let memoryServer = null;

const isLocalMongo = (uri) => {
  const u = uri || '';
  return u.includes('127.0.0.1') || u.includes('localhost');
};

const startMemoryServer = async () => {
  const { MongoMemoryServer } = require('mongodb-memory-server');
  memoryServer = await MongoMemoryServer.create();
  const uri = memoryServer.getUri('smart_parking');
  console.log('📦 Using in-memory MongoDB (no local install needed)');
  console.log('   Data resets when you stop the server.\n');
  return uri;
};

const resolveMongoUri = async () => {
  if (process.env.USE_MEMORY_DB === 'true') {
    return startMemoryServer();
  }
  return process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_parking';
};

const connectDB = async () => {
  let uri = await resolveMongoUri();

  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    if (
      err.name === 'MongooseServerSelectionError' &&
      isLocalMongo(uri) &&
      process.env.USE_MEMORY_DB !== 'false'
    ) {
      console.warn('Local MongoDB not running — starting in-memory database...\n');
      uri = await startMemoryServer();
      const conn = await mongoose.connect(uri);
      console.log(`MongoDB connected: ${conn.connection.host}`);
      await seedIfEmpty();
      return conn;
    }
    throw err;
  }
};

const seedIfEmpty = async () => {
  const User = require('../models/User');
  const count = await User.countDocuments();
  if (count > 0) return;

  console.log('First run: seeding admin + sample parking lot...');
  const seedData = require('../scripts/seedData');
  await seedData();
  console.log('Admin login: admin@smartparking.com / admin123\n');
};

module.exports = { connectDB, startMemoryServer };
