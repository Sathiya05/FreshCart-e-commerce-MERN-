# FreshCart

A production-oriented, full-stack grocery e-commerce platform built with the MERN stack.

> **Current status: Phase 2 — Frontend UI complete.** The storefront, authentication
> screens, and admin console are implemented with clearly labelled demo data.
> Backend APIs, real authentication, and payments arrive in later phases.

## Repository structure

```text
freshcart/
├── client/   React + Vite + Tailwind CSS frontend
├── server/   Express + MongoDB REST API
└── docs/     Architecture and project documentation
```

## Prerequisites

- Node.js 20+ (Node 22 LTS recommended)
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
`server/.env` with your MongoDB Atlas connection string. Never commit this file.

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

Open http://localhost:5173. The Phase 2 storefront loads with demo data. Use the
sign-in page's **Customer demo** or **Admin demo** button to explore guarded areas.
No real authentication or payment is performed.

## Phase 1 verification

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

Production build check:

```bash
cd client
npm run build
```

## Documentation

- [Architecture](docs/architecture.md)
- [Phase 2 UI](docs/phase-2-ui.md)
