# FreshCart

A production-oriented, full-stack grocery e-commerce platform built with the MERN stack.

> **Current status: Phase 7 complete, with post-launch hardening.** Auth (email/password and
> optional server-verified Google sign-in), MongoDB-backed catalog, sign-in-required persistent
> carts, address book, server-owned delivery slots with a `20–30 min` instant option,
> server-calculated checkout, COD and verified Razorpay payments, an order-placed confirmation
> page, Flipkart-style order history, tracking, admin management, a Gemini shopping assistant
> and manual WhatsApp handoff all use real APIs and MongoDB. Razorpay, S3, Gemini and Google
> credentials are read from `server/.env`; with them unset, payments fall back to COD, image
> uploads use a public URL field, the AI assistant is gracefully disabled and Google sign-in is
> disabled. Coupons, reviews, sales reports and refunds remain labelled demos.

---

## Live deployment

| Layer | URL / value |
| --- | --- |
| Storefront (Cloudflare Pages) | `https://freshcart-e-commerce-mern.pages.dev` |
| API base (Render) | `https://freshcart-e-commerce-mern.onrender.com/api` |
| AI status | `https://freshcart-e-commerce-mern.onrender.com/api/ai/status` |
| Delivery slots | `https://freshcart-e-commerce-mern.onrender.com/api/delivery/slots` |
| Google sign-in config | `https://freshcart-e-commerce-mern.onrender.com/api/auth/google/config` |
| Health | `https://freshcart-e-commerce-mern.onrender.com/api/health` |

**Deploy order:** Render API first, then Cloudflare Pages, then hard-refresh the storefront.
Render's free tier can take several seconds to wake from cold start; this is normal.

---

## What is implemented

### Storefront
- Public catalog: categories, products, search, category pages, product details.
- Home hero, sections, offers and database-backed product/category listings.
- Favicon-matching `FreshCartMark` SVG shared by navbar, footer, admin sidebar and auth pages.
- Fully responsive at **360×800**, **393×852**, tablet and desktop: no horizontal overflow,
  fixed mobile menu overlay, safe-area padding, capped dock/toast lift, 44px tap targets where
  practical. Hero CTA buttons stack on phones and sit in a row from `sm` upward.

### Auth
- Email/password register, login, logout, profile update and forgot/reset password.
- HttpOnly access + refresh cookies with silent refresh; session restores on reload.
- Cart requires sign-in; carts are MongoDB-backed only and restored after refresh.
- **Google sign-in**: public client ID from `GET /api/auth/google/config`; ID token verified by
  `google-auth-library` on the server; verified email becomes a FreshCart customer with the same
  session cookies. No client secret and no `VITE_GOOGLE_CLIENT_ID` in the browser.
- Login page shows a "Preparing Google sign-in…" state, a working **Retry Google sign-in**
  button, popup error handling and duplicate-callback protection.
- Auth rate limiting applies only to credential-submitting routes; `/me`, `/google/config`,
  `/refresh` and `/logout` are exempt so normal browsing cannot exhaust the limit.

### Cart, delivery and checkout
- Add to cart, update quantity, remove, clear, Buy Now and wishlist-to-cart all require sign-in.
- Server-owned delivery slots. Compact Blinkit-style day tabs + time chips. Instant slot
  `instant-2030` / `Today, in 20–30 min` is selected first.
- Delivery date, slot, instructions and address confirmation are validated and persisted on the
  order. Delivery details appear in order summary, admin, tracking and conditional WhatsApp text.
- Checkout totals, delivery fee and stock are always recalculated by the server; the browser
  never supplies prices.

### Payments and orders
- Cash on delivery creates a confirmed order immediately.
- Razorpay: server-created order, signed verification, retry for failed/pending orders, webhook
  reconciliation and admin visibility. Razorpay is disabled gracefully when unconfigured.
- COD and paid orders both land on **Your order has been placed!** at
  `/order-confirmation/:id`, with product list, totals, delivery details and a
  **Track this order** button. Old `/payment/success?order=…` links redirect there.
- **My orders** (`/account/orders`) lists every ordered product with image, name, unit, quantity,
  line price, delivery slot, total, **Track order** and **View details** — Flipkart-style.
- Order details and tracking pages show live status, timeline and address. Tracking refreshes
  every 15 seconds. Instant delivery is an ETA option only: there is no rider dispatch, live ETA
  recalculation or GPS tracking.

### Admin
- Live dashboard, products, categories, inventory, orders, customers, coupons, reviews, reports
  and settings backed by MongoDB.
- Store settings are persisted in MongoDB and the save conflict on an existing settings document
  is fixed.
- S3 image uploads when AWS variables are configured; otherwise image URLs remain editable.

### AI shopping assistant
- Google Gemini through server-only `@google/genai`; key never reaches the browser or bundle.
- Exact welcome text and six exact suggested prompts are implemented.
- Tools are grounded in live MongoDB data: product/category search, product details, stock,
  recommendations and store FAQ. Cart and order tools are authenticated, ownership-scoped and
  read-only, except for the confirmation-gated cart mutation flow.
- Cart writes use `prepare_cart_change` → signed, single-use HMAC confirmation token stored in
  MongoDB (`UsedConfirmationToken`) → explicit **Confirm change** or strict affirmative reply.
  No commit tool is exposed to the model. Stock and prices are revalidated server-side.
- Session history, typing indicator, retry/clear controls and immediate Redux cart sync.
- Gemini free-tier limits surface as `AI_RATE_LIMITED` with a customer-safe message.
- Obsolete OpenAI variables (`AI_API_KEY`, `AI_MODEL`, `AI_API_BASE_URL`, `AI_REASONING_EFFORT`)
  are not used and should be unset.

### WhatsApp
- Manual click-to-chat and **Share Cart** only. FreshCart pre-fills a `wa.me` message; the
  customer presses Send. There is no fake sending, no incoming-message claim, no Meta
  credentials and no Facebook login.
- Public fallback number `7812841311` is built into `client/src/utils/whatsapp.js`;
  `VITE_WHATSAPP_PHONE` overrides it. 10-digit Indian numbers are normalised with `+91`.
- Message includes product names, quantities, prices, line totals, subtotal, delivery fee, total
  and delivery details only when they exist.
- No WhatsApp Cloud API code, routes, models, scripts or credentials remain.

---

## Repository structure

```text
freshcart/
├── client/                       React 19 + Vite 6 + Tailwind CSS 4
│   ├── src/
│   │   ├── pages/customer/       Storefront, checkout, orders, confirmation, tracking
│   │   ├── pages/admin/          Admin console
│   │   ├── pages/auth/           Login, register, password flows
│   │   ├── components/           Shared UI, BrandLogo, FreshCartMark, AI chat
│   │   ├── services/             api.js, auth, catalog, commerce, admin, googleIdentity
│   │   ├── redux/                auth, cart, wishlist, UI slices
│   │   ├── hooks/                useAsync, Razorpay, WhatsApp share
│   │   └── routes/AppRoutes.jsx  All routes and route guards
│   └── .env.example
├── server/                       Express 5 + MongoDB (Mongoose 9)
│   ├── config/                   env, database, delivery/AI constants
│   ├── controllers/              auth, cart, order, admin, AI, payment, etc.
│   ├── services/                 cart, order, AI, adminManagement, storeFaq, etc.
│   ├── models/                   User, Product, Order, Setting, UsedConfirmationToken, etc.
│   ├── routes/                   /api route groups
│   ├── middleware/               auth, validation, database, rate-limit-aware error handler
│   ├── scripts/                  create-admin and test scripts
│   └── .env.example
└── docs/                         Architecture and phase-by-phase documentation
```

---

## Tech stack

- **Frontend:** React 19, React Router 7, Redux Toolkit, Axios, Tailwind CSS 4, Vite 6, Recharts,
  Lucide icons, Google Identity Services.
- **Backend:** Node.js 22+, Express 5, MongoDB Atlas + Mongoose 9, express-validator,
  express-rate-limit, Helmet, CORS, cookie-parser, JWT + refresh tokens, bcryptjs.
- **Integrations:** `@google/genai` (server-only), `google-auth-library`, Razorpay, AWS S3,
  Google Identity Services, `wa.me` click-to-chat.

---

## Prerequisites

- Node.js **22+** (required by `@google/genai`)
- npm 10+
- Git
- MongoDB Atlas account (or another MongoDB URI)
- Google Cloud project for Google sign-in (optional)
- Razorpay test keys (optional)
- Gemini API key (optional)

```bash
node --version
npm --version
git --version
```

---

## Local setup

Run from the `freshcart` folder.

### 1. Install dependencies

```bash
cd client && npm install
cd ../server && npm install
cd ..
```

### 2. Create environment files

Windows PowerShell:

```powershell
Copy-Item client\.env.example client\.env
Copy-Item server\.env.example server\.env
```

macOS/Linux:

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

Replace `MONGODB_URI` in `server/.env`, set distinct `JWT_SECRET` and `JWT_REFRESH_SECRET`, then
create the first admin:

```bash
cd server
npm run create-admin
cd ..
```

Never commit `server/.env`, `client/.env`, keys or tokens.

### 3. Start both apps

Terminal 1:

```bash
cd server
npm run dev
```

Terminal 2:

```bash
cd client
npm run dev
```

Open `http://localhost:5173`. Register a customer in the UI or sign in with the admin created
above. There are no demo sign-in buttons.

---

## Environment variables

### Server (`server/.env` — secrets, never exposed)

| Variable | Purpose / default |
| --- | --- |
| `NODE_ENV`, `PORT` | `development`, `5000` |
| `CLIENT_URL` | Comma-separated allowed browser origins for CORS |
| `MONGODB_URI`, `MONGODB_DB_NAME` | Mongo connection and database name (`freshcart`) |
| `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX` | General API limit (15 min / 100) |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | Required in production; must be long and different |
| `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` | `15m`, `7d` |
| `BCRYPT_ROUNDS` | `12` |
| `COOKIE_SECURE`, `COOKIE_SAME_SITE`, `COOKIE_DOMAIN` | Production defaults: `true`, `none`, unset |
| `GOOGLE_CLIENT_ID` | Public OAuth client ID; blank disables Google sign-in |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | One-time bootstrap admin |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `RAZORPAY_CURRENCY` | Online payments; blank → COD only |
| `AI_PROVIDER` | Must be exactly `gemini` |
| `GEMINI_API_KEY` | Server-only Gemini key; blank → assistant disabled |
| `GEMINI_MODEL` | Default `gemini-3.5-flash-lite` (fallback `gemini-3.8-flash`) |
| `AI_TIMEOUT_MS`, `AI_MAX_TOOL_ROUNDS` | `20000`, `6` |
| `AI_RATE_LIMIT_WINDOW_MS`, `AI_RATE_LIMIT_MAX` | `900000`, `30` |
| `AWS_REGION`, `S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_USE_IAM_ROLE`, `S3_PUBLIC_BASE_URL` | S3 uploads; blank → URL field only |

### Client (`client/.env` — public by design)

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | API base, e.g. `https://freshcart-e-commerce-mern.onrender.com/api` |
| `VITE_API_PROXY_TARGET` | Vite dev proxy target only (`http://localhost:5000`) |
| `VITE_WHATSAPP_PHONE` | Public WhatsApp number, digits only; 10-digit Indian numbers get `+91` |

There is deliberately **no** `VITE_GOOGLE_CLIENT_ID`, no Gemini key and no WhatsApp Cloud API
credential in the frontend.

---

## Verification

### Local automated checks

```bash
cd server
npm run test:ai
npm run test:whatsapp-share
npm run test:delivery
npm run test:google-auth
npm run test:product-sku
cd ../client
npm run build
```

`git diff --check` should also be clean.

### API checks

```bash
curl http://localhost:5000/api/health
curl http://localhost:5000/api/categories
curl http://localhost:5000/api/products?limit=8
curl http://localhost:5000/api/delivery/slots
curl http://localhost:5000/api/ai/status
curl http://localhost:5000/api/auth/google/config
```

Health should report `"database": "connected"`. `ai/status` reports non-secret booleans
(`configured`, `provider`, `model`, `providerValid`, `keyPresent`) — never the key.

### Browser checks

- Home shows DB-backed categories/products; hero buttons do not wrap at 360/393px.
- Register/sign in, cart persists after refresh, cart actions require sign-in.
- Google button loads, signs in and redirects; retry works if the API was cold.
- Checkout: address + slot + confirmation; instant `20–30 min` available and selected.
- Place a COD order and pay an online order: both show **Your order has been placed!** with
  **Track this order** and the purchased products.
- `/account/orders` lists every ordered product with price and quantity.
- AI assistant replies from live catalog data; six exact prompts and welcome text match;
  cart changes require confirmation.
- WhatsApp dock and Share Cart pre-fill a message; the customer presses Send manually.
- Admin settings save succeeds; admin order status changes persist.
- No route has horizontal overflow at 360×800 or 393×852.

---

## Deployment

### Render (API)

1. Node runtime **22+**.
2. Set every server variable above that applies, especially
   `MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CLIENT_URL` (include the Pages origin),
   `GOOGLE_CLIENT_ID`, `AI_PROVIDER`, `GEMINI_API_KEY`, `GEMINI_MODEL` and Razorpay keys.
3. Remove obsolete `AI_API_KEY`, `AI_MODEL`, `AI_API_BASE_URL`, `AI_REASONING_EFFORT`.
4. Use `npm start` / `node server.js` and deploy.
5. Verify `/api/health`, `/api/ai/status`, `/api/delivery/slots` and
   `/api/auth/google/config`.

### Cloudflare Pages (frontend)

1. Build command `npm run build`, output directory `dist`, root `client`.
2. Set `VITE_API_URL` to the Render API base and `VITE_WHATSAPP_PHONE` if overriding.
3. Add an SPA rewrite so all paths serve `index.html`.
4. Deploy **after** Render is verified, purge cache and hard-refresh.

---

## Fixes and work completed (delivery history)

| Commit | Work |
| --- | --- |
| `1ff8854` | Handle slow API starts during sign-in |
| `628ed83` | Make admin data live and reconcile Razorpay payments |
| `942c602` | Fix AI assistant model compatibility |
| `b9e679d` | Add non-secret AI config diagnostics |
| `1c88595` | Improve Gemini product discovery tool loop |
| `58ca902` | Map Gemini rate limits to `AI_RATE_LIMITED` |
| `b17d9a4` | WhatsApp Cloud API catalog assistant (later removed entirely) |
| `ddf11e1` | Complete Gemini assistant and manual WhatsApp handoff |
| `1709ccb` | Add fallback WhatsApp number for click-to-chat and Share Cart |
| `430eac1` | Make delivery selection compact and Blinkit-style |
| `6893ab2` | Add instant `20–30 minute` delivery option |
| `bb3b69a` | Require sign-in for cart and restore server cart on refresh |
| `9099db7` | Add server-verified Google sign-in option |
| `9ad82cc` | Fix stale Google sessions and recover expired auth |
| `49ed720` | Make FreshCart fully responsive across mobile, tablet and desktop |
| `6a4bd74` | Fix remaining cart responsiveness issues |
| `259143e` | Make checkout and payment pages responsive on mobile |
| `9cb609a` | Fix checkout overflow at 360px and 393px |
| `a85b811` | Unify FreshCart logo across favicon, navbar, footer, admin and auth |
| `ca30986` | Make mobile menu an overlay and polish responsive tap targets |
| `0c9b6bf` | Fix hero banner button padding on mobile |
| `f36d855` | Make Google sign-in resilient and stop rate-limiting routine auth calls |
| `054d3ba` | Show FreshCart wordmark beside logo on mobile |
| `248a4ad` | Add order-placed confirmation with tracking and product list in orders |
| `b0407b6` | Fix admin settings save conflict on existing store document |

Earlier baseline commits added the MERN foundation, REST API, admin console, Razorpay endpoints,
S3 uploads, Buy Now, cart hardening and initial responsive work.

---

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Google sign-in says "try again later" or times out | Old auth limiter counted `/me`, `/google/config`, `/refresh`, `/logout`, or Render cold start | Deploy backend `b0407b6`+; routine auth paths are exempt and config has one quiet retry |
| Google button does not appear | GSI script load race or blocked script | Fixed by attaching listeners before insertion, 15s timeout and Retry button; check browser network access to `https://accounts.google.com/gsi/client` |
| "Your session has expired" toast on a fresh visit | `/auth/me` 401 triggered refresh/logout | `/auth/me` now skips the refresh interceptor |
| Admin settings save → 500 / "Could not save settings" | MongoDB error 40: same path in `$set` and `$setOnInsert` | Fixed in `adminManagement.service.js`; redeploy Render |
| Cart appears empty after ordering | Cart is deliberately cleared after server creates the order | Confirmation page with products and tracking now replaces the empty-cart view |
| `AI_RATE_LIMITED` / "assistant is busy" | Gemini free-tier quota reached | Retry later; no billing is configured |
| `configured: false` in `/api/ai/status` | Missing/incorrect Gemini variables on Render | Set exact `AI_PROVIDER=gemini`, `GEMINI_API_KEY`, `GEMINI_MODEL`; remove OpenAI variables |
| CORS or cookie problems in production | `CLIENT_URL` missing the Pages origin, or cookie flags wrong | Include the Pages origin; production uses `Secure; SameSite=None` |
| 404 on a deep link | Pages SPA rewrite missing | Rewrite all paths to `index.html` |
| Layout shifts or overflow at 360/393px | Old hero/menu/checkout code | Already fixed in `0c9b6bf`, `ca30986`, `9cb609a`; hard-refresh after deploy |

---

## Security notes

- No API key, client secret or raw credential is present in frontend code, logs, responses or the
  client bundle. Gemini and Google token verification are server-only.
- Rate limiting, validation, auth/authorization, ownership checks and generic production errors
  are used throughout.
- AI tools are backend-controlled; the model cannot issue arbitrary database queries.
- Sensitive actions require explicit confirmation; cart confirmation tokens are signed,
  single-use and stored in MongoDB.
- Prices, stock, delivery slots and order totals are always derived server-side.
- WhatsApp is manual handoff only; nothing is sent on the customer's behalf.

---

## Known limitations

- Instant delivery is an order ETA only — no rider assignment, live ETA recalculation or GPS.
- WhatsApp has no automated inbound/outbound Cloud API; customer presses Send in WhatsApp.
- Coupons, reviews, sales reports and refunds are labelled demos.
- Weekly summary email needs email delivery configured.
- Google sign-in is disabled until `GOOGLE_CLIENT_ID` is set on the API.

---

## Documentation

- [Architecture](docs/architecture.md)
- [Phase 2 UI](docs/phase-2-ui.md)
- [Phase 3 API](docs/phase-3-api.md)
- [Phase 4 Commerce](docs/phase-4-commerce.md)
- [Phase 5 Payments](docs/phase-5-payments.md)
- [Phase 6 AWS](docs/phase-6-aws.md)
- [Gemini AI assistant](docs/gemini-ai-assistant.md)
- [WhatsApp click-to-chat and Share Cart](docs/phase-7-whatsapp.md)
