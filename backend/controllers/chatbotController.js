const FAQ = [
  {
    keywords: ['book', 'booking', 'reserve', 'reservation'],
    answer:
      'Go to Book Parking, select a lot, choose your date and time, pick an available slot, and complete payment to confirm your booking.',
  },
  {
    keywords: ['pay', 'payment', 'price', 'cost', 'rate'],
    answer:
      'Rates are shown per lot (hourly). Total = hours × hourly rate. Pay online from My Bookings using card (Stripe) or demo pay if Stripe is not configured.',
  },
  {
    keywords: ['cancel', 'refund'],
    answer:
      'Open My Bookings and click Cancel on a pending or confirmed booking. Refunds for paid bookings depend on admin policy.',
  },
  {
    keywords: ['slot', 'available', 'availability'],
    answer:
      'Available slots are shown in green when you select a lot and time range. Maintenance slots are hidden from booking.',
  },
  {
    keywords: ['admin', 'support', 'help', 'contact', 'chat'],
    answer:
      'Use Support Chat in the customer menu to message an admin in real time, or email us through your profile.',
  },
  {
    keywords: ['hour', 'time', 'duration'],
    answer:
      'Minimum booking is 1 hour. Select start and end date/time when booking; overlapping bookings on the same slot are not allowed.',
  },
  {
    keywords: ['hello', 'hi', 'hey'],
    answer: 'Hello! I am the Smart Parking assistant. Ask about booking, payments, slots, or support chat.',
  },
];

const getChatbotReply = (message) => {
  const lower = message.toLowerCase();
  for (const item of FAQ) {
    if (item.keywords.some((k) => lower.includes(k))) {
      return item.answer;
    }
  }
  return 'I am not sure about that. Try asking about booking, payments, cancellation, or use Support Chat to reach an admin.';
};

const askChatbot = async (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) {
    return res.status(400).json({ message: 'Message is required' });
  }
  const reply = getChatbotReply(message.trim());
  res.json({ reply });
};

module.exports = { askChatbot };
