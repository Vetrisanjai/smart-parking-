# Smart Parking System (MERN)

Full-stack smart parking with slot booking, online payments (Stripe + demo mode), FAQ chatbot, customer/admin dashboards, and real-time customer–admin chat.

## Features

- **Slot booking** — pick lot, time range, available slot; overlap prevention
- **Online payment** — Stripe Checkout, or demo pay without Stripe keys
- **Chatbot** — rule-based FAQ assistant (bottom-right on customer pages)
- **Dashboards** — customer overview; admin stats, lots, slots, bookings
- **Live chat** — Socket.io between customers and admin

## Prerequisites

- Node.js 18+
- MongoDB running locally **or** MongoDB Atlas connection string

### MongoDB (optional for local dev)

**No MongoDB installed?** Just run `npm run dev` in `backend` — it automatically uses an **in-memory database** when local MongoDB is not running (data resets when you stop the server).

For persistent data, use one of:
- [MongoDB Community](https://www.mongodb.com/try/download/community) (start the Windows service)
- Docker: `docker compose up -d` from the project root
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) — set `MONGO_URI` in `backend/.env`

If you see `EADDRINUSE :::5000`, stop the other process on port 5000 or change `PORT` in `backend/.env`.

## Quick start

### 1. Backend

```bash
cd backend
npm install
```

Copy `.env.example` to `.env` (or use the included `.env`) and set `MONGO_URI` if needed.

```bash
npm run seed
npm run dev
```

Server: `http://localhost:5000`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173`

## Default accounts (after seed)

| Role     | Email                    | Password  |
|----------|--------------------------|-----------|
| Admin    | admin@smartparking.com   | admin123  |
| Customer | Register at `/register`  | —         |

Seed also creates **Central Plaza Parking** with 12 slots (A-01 … A-12).

## Stripe (optional)

Add to `backend/.env`:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Without Stripe keys, **Pay now** uses demo mode and marks the booking paid.

## Project structure

```text
smart-parking/
├── backend/          Express API + Socket.io
├── frontend/         React (Vite)
└── README.md
```

## API overview

- `POST /api/auth/register` | `login`
- `GET/POST /api/lots` (admin write)
- `GET /api/slots/available` | CRUD slots (admin)
- `POST /api/bookings` | `GET /bookings/mine`
- `POST /api/payments/checkout/:bookingId`
- `POST /api/chatbot/ask`
- `GET/POST /api/messages` + Socket.io events

## License

MIT — for learning and project use.
