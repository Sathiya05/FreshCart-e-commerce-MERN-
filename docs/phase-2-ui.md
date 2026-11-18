# Phase 2 — Frontend UI

Phase 2 turns the Phase 1 verification screen into the full FreshCart storefront
and admin console UI. No commerce backend is introduced in this phase: all data
is clearly labelled demo data, and all mutations stay in local React/Redux state.

## Scope delivered

- Responsive design system built on Tailwind CSS v4 design tokens.
- Customer storefront: home, shop with filters, categories, product details,
  search, cart, wishlist, checkout preview, payment result layouts, orders,
  addresses, profile, and content pages.
- Authentication screens: sign in, register, forgot password, reset password.
- Admin console: overview, products, categories, inventory, orders, customers,
  coupons, reviews, sales reports, and settings.
- Shared primitives for buttons, badges, dialogs, tables, skeletons, empty and
  error states, ratings, breadcrumbs, quantity controls, order summaries, and toasts.
- Customer, auth, and admin layouts with route guards.
- Redux Toolkit store for demo auth, cart, wishlist, and toast UI state.

## Technology

| Concern | Choice |
| --- | --- |
| Framework | React 19 + Vite 6.4.4 |
| Styling | Tailwind CSS v4 with custom `@theme` tokens |
| Routing | React Router DOM 7 |
| State | Redux Toolkit + React Redux |
| HTTP client | Axios (configured in Phase 1; used by real APIs from Phase 3) |
| Icons | Lucide React |
| Charts | Recharts |
| Imagery | Unsplash grocery photography |

## Route map

| Path | Purpose | Guard |
| --- | --- | --- |
| `/` | Home | Public |
| `/shop` | Catalog with filters and pagination | Public |
| `/categories`, `/categories/:slug` | Category browsing | Public |
| `/search?q=` | Search results | Public |
| `/products/:id` | Product details | Public |
| `/cart`, `/wishlist` | Cart and saved items | Public |
| `/checkout` | Checkout interface preview | Public |
| `/payment/success`, `/payment/failure` | Payment result layouts | Public |
| `/about`, `/contact`, `/faq`, `/privacy`, `/terms` | Content pages | Public |
| `/login`, `/register`, `/forgot-password`, `/reset-password/:token` | Auth screens | Public |
| `/account/*` | Profile, addresses, orders, tracking | Customer sign-in required |
| `/admin/*` | Admin console | Admin sign-in required |
| `*` | Not found | Public |

## Demo boundary

Everything that represents server data lives in
`client/src/data/demoData.js` under `DEMO_*` names. Async placeholder services
wrap that data so loading, empty, and error states can be designed now:

- `services/catalog.service.js`
- `services/account.service.js`
- `services/admin.service.js`

Phase 3 adds authenticated API endpoints for catalog and admin data. Migrating
these UI adapters to Axios is the next integration step. Redux currently stores
cart, wishlist, and demo session state in memory; persistence and backend
synchronisation are intentionally deferred.

The login page still exposes **Customer demo** and **Admin demo** buttons. They
set local Redux state and do not call an API or issue a JWT; the real auth API is
documented in [Phase 3 API](phase-3-api.md).

## Payment safety

Checkout is visually complete but deliberately non-functional for payments:

- the primary action is disabled and labelled for Phase 5;
- a warning banner states that no payment is collected;
- success and failure pages are layout previews only, with no fake verification.

No Razorpay credentials, order creation, or signature verification exist in
Phase 2.

## Admin console

Admin pages use `DataTable`, `Modal`, `ConfirmDialog`, `StatCard`, Recharts, and
toast feedback. Product, category, inventory, order, customer, coupon, review,
and settings changes are local demo mutations. Destructive actions always ask
for confirmation before changing state.

Admin pages are loaded with `React.lazy` so Recharts stays out of the initial
storefront bundle.

## Verification

```bash
cd client
npm run build
npm audit --omit=dev
```

`npm run build` must complete successfully. A production dependency audit should
remain clean. The Vite 6 pin documented in `architecture.md` is unchanged.

## Not included yet

- MongoDB models and API routes
- JWT authentication and protected endpoints
- Backend cart, inventory, coupon, address, and order APIs
- Razorpay integration
- AWS infrastructure or deployment
- Automated tests (Phase 8)

Do not begin Phase 3 without explicit confirmation.
