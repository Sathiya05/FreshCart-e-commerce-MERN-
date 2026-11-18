# FreshCart Architecture

## Phase 1 — Foundation

FreshCart is organized as two independently runnable applications inside one Git repository:

```text
freshcart/
├── client/                 React + Vite single-page application
│   ├── public/             Static assets copied as-is into the build
│   └── src/
│       ├── components/     Shared UI components (added in Phase 2)
│       ├── layouts/        Customer/admin layouts (added in Phase 2)
│       ├── pages/          Route pages (added in Phase 2)
│       ├── redux/          Redux Toolkit store/slices (added in Phase 2/3)
│       ├── services/       API clients such as Axios instances
│       └── utils/          Pure helper functions
├── server/                 Express REST API
│   ├── config/             Environment and database configuration
│   ├── controllers/        Request handlers
│   ├── models/             Mongoose schemas (added in Phase 3)
│   ├── routes/             Route definitions
│   ├── middleware/         Cross-cutting request handling
│   ├── services/           Business logic (added in Phase 3)
│   ├── validators/         Express Validator chains (added in Phase 3)
│   └── utils/              Server helper functions
└── docs/                   Living project documentation
```

## Request flow in Phase 1

```text
Browser
  -> React component calls src/services/api.js
  -> Axios GET /api/health
  -> Vite dev proxy forwards /api to http://localhost:5000
  -> Express applies helmet, CORS, body parsing, cookies and rate limiting
  -> GET /api/health controller returns service status and MongoDB state
```

In production, `VITE_API_URL` can point to a separate API origin such as
`https://api.example.com/api`. The browser code does not need to change.

## Design decisions

- **Separate client and server packages:** frontend and backend can be deployed,
  scaled and debugged independently.
- **Environment-driven configuration:** no credentials are committed. Both apps
  ship `.env.example` files that document required variables.
- **Axios service module:** one configured client prevents duplicated base URLs
  and gives future interceptors (auth token, retries, error normalization) one
  place to live.
- **Security baseline now:** Helmet, restricted CORS, rate limiting and safe error
  responses are installed in Phase 1 so later features inherit them.
- **Database state in health output:** the API can start without MongoDB in local
  development, which makes UI-only work possible. Production startup fails fast
  if MongoDB is unavailable. The health response always reports the real state.

## Planned evolution

- Phase 2: design system, reusable components, customer and admin UI shells.
- Phase 3: Mongoose models and authenticated CRUD APIs.
- Phase 4: cart, inventory, coupons, addresses, delivery slots and orders.
- Phase 5: Razorpay order creation, verification and webhooks.
- Phase 6/7: AWS fundamentals and deployment.
- Phase 8/9: testing and portfolio presentation.
