# FreshCart

A production-oriented, full-stack grocery e-commerce platform built with the MERN stack.

> **Current status: Phase 6, Gemini AI assistant and WhatsApp Cloud API wiring are implemented.** Auth,
> catalog, admin catalog, persistent carts, address book, server-calculated
> checkout, COD orders, verified online payments, order history/tracking and admin
> order status updates use real APIs. The website assistant uses Google Gemini
> through `@google/genai` on the server, with live catalog, cart, and store FAQ
> tools. WhatsApp can answer catalog and FAQ questions through a signed webhook,
> but cannot access carts or place orders. Razorpay, S3, Gemini and Meta credentials
> are read from `server/.env`; without them payments fall back to COD, admin image
> uploads fall back to a public URL field, and the assistants are gracefully
> disabled. Coupons, customer reviews, sales reports and refunds remain clearly
> labelled demos until their own phases.

## Repository structure

```text
freshcart/
├── client/   React + Vite + Tailwind CSS frontend
├── server/   Express + MongoDB REST API
└── docs/     Architecture and project documentation
```

## Prerequisites

- Node.js 22+ (required by `@google/genai`)
- npm 10+
- Git
- MongoDB Atlas account for database-backed work

Verify your tools:

```bash
node --version
npm --version
git --version
```

## Phase 1 setup

Run these commands from the `freshcart` folder.

### 1. Install dependencies

```bash
cd client
npm install
cd ../server
npm install
cd ..
```

### 2. Create local environment files

```bash
Copy-Item client\.env.example client\.env
Copy-Item server\.env.example server\.env
```

On macOS/Linux:

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

For database-backed development, replace the `MONGODB_URI` placeholder in
`server/.env` with your MongoDB Atlas connection string. Set distinct
`JWT_SECRET` and `JWT_REFRESH_SECRET` values, then create the first admin:

```bash
cd server
npm run create-admin
```

Never commit `server/.env` or real credentials.

### 3. Start both applications

Terminal 1 — API:

```bash
cd server
npm run dev
```

Terminal 2 — React app:

```bash
cd client
npm run dev
```

Open http://localhost:5173. The storefront reads the live catalog once MongoDB is
connected. Register a customer account in the UI, or create an admin locally with
`npm run create-admin` from `server/`, then sign in normally — there are no demo
sign-in buttons. Sessions are restored from HttpOnly cookies on reload.

## Verification

API directly:

```bash
curl http://localhost:5000/api/health
```

Expected response shape:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "freshcart-api",
    "environment": "development",
    "timestamp": "2026-01-01T00:00:00.000Z",
    "uptimeSeconds": 12,
    "database": "connected"
  }
}
```

If `database` is `not_configured` or `disconnected`, the API is still running, but
`MONGODB_URI` is missing or the Atlas connection needs attention. Check the server
terminal for a detailed warning.

With MongoDB connected, verify the catalog and authentication:

```bash
curl http://localhost:5000/api/categories
curl http://localhost:5000/api/products?limit=8
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"you@example.com","password":"your-password"}'
```

In the browser, confirm the home page shows database-backed categories/products,
sign in with a real account, then open `/admin` with an admin account and change a
product or category. Those writes go straight to MongoDB through the protected API.

See [Phase 3 API](docs/phase-3-api.md), [Phase 4 Commerce](docs/phase-4-commerce.md),
[Phase 5 Payments](docs/phase-5-payments.md), [Phase 6 AWS](docs/phase-6-aws.md)
[Gemini AI assistant](docs/gemini-ai-assistant.md) and
[WhatsApp Cloud API](docs/phase-7-whatsapp.md) for routes, request bodies,
environment variables and the React integration map.

Production build check:

```bash
cd client
npm run build
```

## Documentation

- [Architecture](docs/architecture.md)
- [Phase 2 UI](docs/phase-2-ui.md)
- [Phase 3 API](docs/phase-3-api.md)
- [Phase 4 Commerce](docs/phase-4-commerce.md)
- [Phase 5 Payments](docs/phase-5-payments.md)
- [Phase 6 AWS](docs/phase-6-aws.md)
- [Gemini AI assistant](docs/gemini-ai-assistant.md)
- [WhatsApp Cloud API](docs/phase-7-whatsapp.md)
