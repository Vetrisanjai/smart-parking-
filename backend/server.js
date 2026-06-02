require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const setupChat = require('./sockets/chat');
const { stripeWebhook } = require('./controllers/paymentController');

const startServer = async () => {
  try {
    await connectDB();
  } catch (err) {
    console.error('\n❌ MongoDB connection failed:', err.message);
    console.error('\nFix options:');
    console.error('  1. Run: npm run dev   (auto uses in-memory DB if local Mongo is off)');
    console.error('  2. Install MongoDB locally or use Docker: docker compose up -d');
    console.error('  3. MongoDB Atlas: set MONGO_URI in backend/.env');
    console.error('  4. Force in-memory: USE_MEMORY_DB=true npm run dev\n');
    process.exit(1);
  }

  const app = express();
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  });

  setupChat(io);

  app.post(
    '/api/payments/webhook',
    express.raw({ type: 'application/json' }),
    stripeWebhook
  );

  app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    });
  });

  app.use('/api/auth', require('./routes/authRoutes'));
  app.use('/api/lots', require('./routes/lotRoutes'));
  app.use('/api/slots', require('./routes/slotRoutes'));
  app.use('/api/bookings', require('./routes/bookingRoutes'));
  app.use('/api/payments', require('./routes/paymentRoutes'));
  app.use('/api/chatbot', require('./routes/chatbotRoutes'));
  app.use('/api/messages', require('./routes/messageRoutes'));

  app.use(errorHandler);

  const PORT = process.env.PORT || 5000;
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Port ${PORT} is already in use.`);
      console.error('   Stop the other process, then run npm run dev again:');
      console.error(`   netstat -ano | findstr :${PORT}`);
      console.error('   Stop-Process -Id <PID> -Force\n');
    } else {
      console.error(err);
    }
    process.exit(1);
  });
  server.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health`);
  });
};

startServer();
