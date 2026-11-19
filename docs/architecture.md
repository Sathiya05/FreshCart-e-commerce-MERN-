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

## Phase 2 frontend architecture

The React application is organized by responsibility:

```text
client/src/
├── components/   Reusable UI and shared stateful widgets
├── data/         Clearly labelled DEMO_* catalog/account/admin fixtures
├── hooks/        useAsync helper for demo service loading states
├── layouts/      Customer, auth, and admin shells plus route guards
├── pages/        customer/, auth/, and admin/ route screens
├── redux/        Store and auth/cart/wishlist/UI slices
├── routes/       AppRoutes route tree with lazy admin pages
├── services/     Axios-backed auth/catalog/admin services; demo services for later phases
└── utils/        Formatting helpers
```

Phase 2 uses three layout branches:

1. `CustomerLayout` — announcement bar, navigation, storefront footer, toasts.
2. `AuthLayout` — split-screen shell for sign-in and account recovery.
3. `AdminRoute` → `AdminLayout` — role guard, sidebar, top bar, toasts.

`/account/*` is wrapped in `ProtectedRoute`. All admin pages are lazy-loaded so
charting code is fetched only when the console is opened. Phase 3 migrated the
catalog and admin catalog adapters to the real API; remaining demo services keep
explicit `DEMO_*` names so preview data is never mistaken for live results.

See [Phase 2 UI](phase-2-ui.md) for the route map, demo boundaries, and payment
safety notes.

## Phase 3 API architecture

```text
Browser/API client
  -> Express route module
  -> express-validator chain (writes)
  -> database guard + JWT protect + role authorize
  -> controller
  -> service/query helper
  -> Mongoose model
  -> MongoDB
```

Authentication uses two JWTs in HttpOnly cookies: a 15-minute access token and
a 7-day refresh token. The access token is also available in a Bearer header for
non-browser clients. `POST /api/auth/logout` rotates the user's `tokenVersion`,
which invalidates previously issued refresh tokens.

Public route modules (`/api/categories`, `/api/products`) expose only active
records. Admin route modules (`/api/admin/*`) are guarded by `protect` and
`authorize('admin')` and can read inactive records. Validation errors are
normalized to `422 VALIDATION_ERROR`; Mongoose cast, validation and duplicate
errors are normalized by the shared error middleware.

Data endpoints return `503 DATABASE_UNAVAILABLE` when MongoDB is not connected,
so the API can still start locally for health checks and UI development without
credentials. Production startup still fails fast when MongoDB is unreachable.

See [Phase 3 API](phase-3-api.md) for endpoints, environment variables and
bootstrap instructions.

## Phase 3 UI integration

The React app calls the API through one Axios instance with `/api` as its default
base URL and `withCredentials: true`. In development Vite proxies `/api` to the
Express server; in production `VITE_API_URL` can point to a separate API origin.

```text
Component
  -> useAsync or Redux async thunk
  -> service module (api.js)
  -> Express endpoint
  -> normalized response / error message
  -> loading, empty, error, or success UI
```

`authSlice.restoreSession()` runs before routes render, so guards use the real
signed-in user rather than local demo state. A 401 on a non-auth request triggers
one silent `/auth/refresh` and then retries the original request. Service
normalizers translate server product/category fields into the shapes used by the
existing cards and tables.

Live UI areas: registration/login/logout/profile, public catalog and search,
admin dashboard overview, product/category CRUD, stock adjustments, persistent
cart, address book, COD checkout, order history/tracking and admin order status.
Preview-only areas: coupons, reviews, customers, password recovery, sales
reports, online payments and image uploads. See the integration tables in
[Phase 3 API](phase-3-api.md#react-integration) and
[Phase 4 Commerce](phase-4-commerce.md).

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
- **Axios service module:** one configured client owns the base URL, credentials
  and the silent refresh/error-normalization interceptors.
- **Security baseline now:** Helmet, restricted CORS, rate limiting and safe error
  responses are installed in Phase 1 so later features inherit them.
- **Database state in health output:** the API can start without MongoDB in local
  development, which makes UI-only work possible. Production startup fails fast
  if MongoDB is unavailable. The health response always reports the real state.
- **No Nodemon dependency:** the server's `dev` script uses Node's built-in
  `--watch` flag, avoiding vulnerable transitive file-watcher packages.
- **Vite version pin:** Vite 6.4.4 and `@vitejs/plugin-react` 5.2.0 are pinned.
  Current Vite releases depend on `picomatch` versions covered by an unpatched
  upstream ReDoS advisory. The finding affects the local development server only;
  `npm audit --omit=dev` reports zero vulnerabilities for shipped dependencies.

## Planned evolution

- Phase 2 (complete): design system, reusable components, customer storefront,
  and admin console UI. See [phase-2-ui.md](phase-2-ui.md).
- Phase 3 (complete): Mongoose models, JWT authentication, validated category
  and product CRUD, and React integration for those endpoints. See
  [phase-3-api.md](phase-3-api.md).
- Phase 4 (current): persistent cart, addresses, COD checkout, order history,
  tracking and admin order status. See [phase-4-commerce.md](phase-4-commerce.md).
- Phase 5: Razorpay order creation, verification and webhooks.
- Phase 6/7: AWS fundamentals and deployment.
- Phase 8/9: testing and portfolio presentation.
