const Booking = require('../models/Booking');
const Razorpay = require('razorpay');
const crypto = require('crypto');

let stripeClient = null;

const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key?.startsWith('sk_')) return null;
  if (!stripeClient) stripeClient = require('stripe')(key);
  return stripeClient;
};

const createCheckoutSession = async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId)
    .populate('lot', 'name')
    .populate('slot', 'slotNumber');

  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (booking.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Access denied' });
  }
  if (booking.paymentStatus === 'paid') {
    return res.status(400).json({ message: 'Already paid' });
  }

  const stripe = getStripe();
  if (!stripe) {
    booking.paymentStatus = 'paid';
    booking.bookingStatus = 'confirmed';
    await booking.save();
    return res.json({
      demo: true,
      message: 'Demo mode: payment marked as paid (add Stripe keys for real payments)',
      booking,
    });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: req.user.email,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Parking - ${booking.lot.name}`,
            description: `Slot ${booking.slot.slotNumber}`,
          },
          unit_amount: Math.round(booking.amount * 100),
        },
        quantity: 1,
      },
    ],
    metadata: { bookingId: booking._id.toString() },
    success_url: `${process.env.CLIENT_URL}/customer/bookings?paid=1`,
    cancel_url: `${process.env.CLIENT_URL}/customer/bookings?cancelled=1`,
  });

  booking.stripeSessionId = session.id;
  await booking.save();

  res.json({ url: session.url, sessionId: session.id });
};

const stripeWebhook = async (req, res) => {
  const stripe = getStripe();
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    if (stripe && process.env.STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } else {
      event = JSON.parse(req.body.toString());
    }
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const bookingId = session.metadata?.bookingId;
    if (bookingId) {
      const booking = await Booking.findById(bookingId);
      if (booking) {
        booking.paymentStatus = 'paid';
        booking.bookingStatus = 'confirmed';
        await booking.save();
      }
    }
  }

  res.json({ received: true });
};

const confirmDemoPayment = async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (booking.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Access denied' });
  }
  booking.paymentStatus = 'paid';
  booking.bookingStatus = 'confirmed';
  await booking.save();
  res.json(booking);
};

const createRazorpayOrder = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate('lot', 'name')
      .populate('slot', 'slotNumber');

    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Already paid' });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return res.status(500).json({ message: 'Razorpay keys not configured on server' });
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const options = {
      amount: Math.round(booking.amount * 100), // in paise
      currency: 'INR',
      receipt: booking._id.toString(),
    };

    const order = await razorpay.orders.create(options);
    
    booking.razorpayOrderId = order.id;
    await booking.save();

    res.json({
      keyId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      booking,
    });
  } catch (err) {
    console.error('Razorpay Order Error:', err);
    res.status(500).json({ message: err.message || 'Razorpay order creation failed' });
  }
};

const verifyRazorpayPayment = async (req, res) => {
  try {
    const { bookingId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    if (!bookingId || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ message: 'All payment parameters are required' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(500).json({ message: 'Razorpay secret key not configured' });
    }

    const hmac = crypto.createHmac('sha256', keySecret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature === razorpay_signature) {
      booking.paymentStatus = 'paid';
      booking.bookingStatus = 'confirmed';
      booking.razorpayOrderId = razorpay_order_id;
      booking.razorpayPaymentId = razorpay_payment_id;
      booking.razorpaySignature = razorpay_signature;
      await booking.save();
      
      res.json({ success: true, booking });
    } else {
      booking.paymentStatus = 'failed';
      await booking.save();
      res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }
  } catch (err) {
    console.error('Razorpay Verify Error:', err);
    res.status(500).json({ message: err.message || 'Payment verification failed' });
  }
};

module.exports = {
  createCheckoutSession,
  stripeWebhook,
  confirmDemoPayment,
  createRazorpayOrder,
  verifyRazorpayPayment,
};
