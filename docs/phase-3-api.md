# Phase 3 — Authenticated REST API

Phase 3 replaces the Phase 1 verification-only backend with a MongoDB-backed API.
It adds real password hashing, JWT sessions, role-based admin access, validated
category/product CRUD, and clear service errors.

The React UI still uses its clearly labelled Phase 2 demo services. Wiring those
screens to these endpoints is the next integration step; no hidden fallback is
built into the API.

## Configuration

Copy `server/.env.example` to `server/.env` and set:

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB Atlas connection string. Required for data endpoints. |
| `MONGODB_DB_NAME` | Database name, default `freshcart`. |
| `JWT_SECRET` | Signs 15-minute access tokens. Required in production. |
| `JWT_REFRESH_SECRET` | Signs 7-day refresh tokens. Must differ from `JWT_SECRET`. |
| `JWT_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | Token lifetimes. |
| `COOKIE_SECURE`, `COOKIE_SAME_SITE`, `COOKIE_DOMAIN` | HttpOnly cookie behaviour. |
| `BCRYPT_ROUNDS` | Password hashing cost, default `12`. |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Bootstrap admin credentials. |

Development falls back to local-only JWT secrets if the JWT variables are unset.
Production startup fails immediately if either secret is missing.

### Create an admin account

Public registration always creates a `customer`. Create the first admin locally:

```bash
cd server
npm run create-admin
```

The script reads the `ADMIN_*` variables from `server/.env`, creates the account
or upgrades an existing one, and hashes the password with bcrypt. Do not commit
real admin credentials.

## Response format

Success responses use:

```json
{
  "success": true,
  "data": {}
}
```

Errors use:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed.",
    "details": [{ "field": "email", "message": "Enter a valid email address" }]
  }
}
```

Database-backed routes return `503 DATABASE_UNAVAILABLE` when `MONGODB_URI` is
missing or the connection is down. `GET /api/health` always reports the real
database state and never fakes connectivity.

## Authentication

- `POST /api/auth/register` creates a customer account.
- `POST /api/auth/login` verifies the password and starts a session.
- `POST /api/auth/refresh` rotates cookies using the HttpOnly refresh token.
- `POST /api/auth/logout` increments the user's token version and clears cookies.
- `GET /api/auth/me` returns the signed-in user.
- `PATCH /api/auth/me` updates name, phone, or avatar.

Both tokens are stored in HttpOnly cookies scoped to `/api`. The API also
accepts an `Authorization: Bearer <accessToken>` header and returns the access
token in the login/register response for non-browser clients. The refresh token
is never returned in a response body.

Example login:

```bash
curl -i -X POST http://localhost:5000/api/auth/login \
  -H 'Content-Type: application/json' \
  -c cookies.txt \
  -d '{"email":"you@example.com","password":"your-password"}'
```

The browser client uses `withCredentials: true` in `client/src/services/api.js`
so cookies are sent with same-origin and configured cross-origin requests.

## Public catalog endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Service and database state |
| `GET` | `/api/categories` | Active categories; supports `?q=` |
| `GET` | `/api/categories/:slug` | One active category |
| `GET` | `/api/products` | Paginated active products |
| `GET` | `/api/products/:id` | Product by MongoDB ID or slug |

Product query parameters:

| Parameter | Example | Notes |
| --- | --- | --- |
| `q` | `almond` | Searches name, description, brand and tags |
| `category` or `categorySlug` | `fruits` | Accepts an ID or slug |
| `minPrice`, `maxPrice` | `50` | Applies to effective price (`discountPrice` or `price`) |
| `availability` | `in-stock`, `low-stock` | Stock filters |
| `sort` | `price-asc`, `price-desc`, `rating`, `name`, `newest`, `featured` | Defaults to `featured` |
| `page`, `limit` | `1`, `12` | `limit` capped at 60 |
| `ids` | `id1,id2` | Comma-separated product IDs |
| `featured`, `bestSeller`, `dailyDeal` | `true` | Boolean filters |

Example:

```bash
curl "http://localhost:5000/api/products?categorySlug=fruits&sort=price-asc&limit=8"
```

## Admin endpoints

All `/api/admin` routes require a valid access token with `role: admin`.

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/admin/overview` | Real product, category, customer and stock counts |
| `GET` | `/api/admin/categories` | All categories, including inactive |
| `POST` | `/api/admin/categories` | Create category |
| `PATCH` | `/api/admin/categories/:id` | Update category |
| `DELETE` | `/api/admin/categories/:id` | Delete category; blocked while products use it |
| `GET` | `/api/admin/products` | All products; supports `?status=active|inactive|all` |
| `GET` | `/api/admin/products/:id` | One product, including inactive |
| `POST` | `/api/admin/products` | Create product |
| `PATCH` | `/api/admin/products/:id` | Update product |
| `DELETE` | `/api/admin/products/:id` | Delete product |

Example create:

```bash
curl -X POST http://localhost:5000/api/admin/products \
  -H 'Content-Type: application/json' \
  -b cookies.txt \
  -d '{
    "name": "Farm Tomatoes",
    "category": "CATEGORY_ID",
    "price": 60,
    "discountPrice": 49,
    "stock": 120,
    "unit": "1 kg",
    "images": ["https://images.unsplash.com/photo-1592924357228-91a4daadcfea"],
    "featured": true
  }'
```

Slugs are generated automatically from names. Category deletion returns
`409 CATEGORY_IN_USE` if any product still references it. Duplicate names,
slugs, or SKUs return `409 DUPLICATE_VALUE`.

## Data models

- **User** — name, unique email, bcrypt password hash, phone, avatar, role,
  addresses, active flag and token version. Password and token version are
  excluded from queries and serialized output by default.
- **Category** — unique name and slug, description, image, active flag and sort order.
- **Product** — name, slug, category reference, pricing, stock, unit, images,
  ratings, tags and merchandising flags. Discount price must be lower than price.

## Not in Phase 3

- Cart, addresses, coupons, inventory reservations and orders (Phase 4)
- Payment orders, Razorpay verification and webhooks (Phase 5)
- AWS infrastructure and deployment (Phase 6/7)
- Automated API tests (Phase 8)
- Frontend service migration from `DEMO_*` fixtures to these endpoints

Do not begin those phases without explicit confirmation.
