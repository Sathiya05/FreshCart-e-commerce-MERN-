# Phase 2 — Frontend UI

Phase 2 turns the Phase 1 verification screen into the full FreshCart storefront
and admin console UI. No commerce backend was introduced in that phase: data was
clearly labelled demo data, and mutations stayed in local React/Redux state.

> **Current status:** this document describes the original Phase 2 UI. The Phase 3
> API is now connected to authentication, catalog browsing, admin catalog CRUD and
> inventory. Remaining screens still use labelled demo services.

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

During Phase 2, everything representing server data lived in
`client/src/data/demoData.js` under `DEMO_*` names. Those fixtures remain for
flows that do not have APIs yet:

- `services/account.service.js` — addresses, orders, coupons, contact form.
- `services/admin.service.js` — `getDemoAdmin*` order/customer/coupon/review previews.
- Redux cart and wishlist slices — in-memory only.

Phase 3 replaced the old demo implementations of `catalog.service.js` and the
admin catalog/overview functions with Axios calls. Sign-in and registration now
call the real auth API; the demo sign-in buttons were removed. See
[Phase 3 API](phase-3-api.md#react-integration) for the current integration map.

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

Phase 3 and its React integration are complete. Do not begin Phase 4 without
explicit confirmation.
