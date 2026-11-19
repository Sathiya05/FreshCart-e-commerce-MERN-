# Phase 4 — Core commerce API

Phase 4 turns the cart, address book, checkout, customer orders and admin order
screens into live API-backed flows. Payments, coupons, reviews and image uploads
are intentionally outside this phase.

## Response contract

All endpoints use the existing envelope:

```json
{ "success": true, "data": { } }
```

Errors use:

```json
{
  "success": false,
  "error": { "code": "ERROR_CODE", "message": "Human-readable message", "details": [] }
}
```

Cart and order routes run `requireDatabase` then `protect`. Admin routes also
require `authorize('admin')`. Validators run before controllers and produce
`422 VALIDATION_ERROR` with field details.

## Endpoints

### Cart — `/api/cart`

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/cart` | Current user's cart with live product data and totals |
| `POST` | `/api/cart/items` | Add `{ productId, quantity }` |
| `PATCH` | `/api/cart/items/:id` | Set quantity for a product ID |
| `DELETE` | `/api/cart/items/:id` | Remove a product from the cart |
| `DELETE` | `/api/cart` | Empty the cart |

Quantities are validated as integers of at least 1. The server rejects inactive
products and quantities above current stock. Prices always come from the live
`Product` document.

The cart response is normalized for the existing UI:

```json
{
  "items": [{ "product": { "id": "...", "image": "..." }, "quantity": 2 }],
  "itemCount": 2,
  "subtotal": 84,
  "deliveryFee": 30,
  "deliveryCharge": 30,
  "totalAmount": 114
}
```

Delivery is free at or above ₹499. The server is authoritative; the client only
mirrors this rule for display.

### Address book — `/api/account/addresses`

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/account/addresses` | List addresses for the signed-in user |
| `POST` | `/api/account/addresses` | Create an address |
| `PATCH` | `/api/account/addresses/:id` | Update an address |
| `PATCH` | `/api/account/addresses/:id/default` | Make an address the default |
| `DELETE` | `/api/account/addresses/:id` | Delete an address |

Required fields are `fullName`, `phone`, `addressLine`, `city`, `state` and
`pincode`. The UI sends `addressType`; the server stores it as `label` and
serializes both `label` and `addressType` so existing cards keep working. Exactly
one address remains the default where possible.

### Orders — `/api/orders`

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/orders` | Create a COD order from the current cart |
| `GET` | `/api/orders` | Paginated order history |
| `GET` | `/api/orders/:id` | Order detail owned by the user |
| `GET` | `/api/orders/:id/track` | Tracking payload with timeline |

Order creation accepts:

```json
{
  "addressId": "69...",
  "paymentMethod": "cod",
  "deliverySlot": "Tomorrow, 10 AM - 12 PM"
}
```

The server:

1. Reloads the cart and re-checks product availability and stock.
2. Requires a saved address belonging to the user.
3. Recalculates subtotal, delivery and total from live prices.
4. Conditionally decrements stock inside the request.
5. Creates an immutable order with snapshots of product and address data.
6. Clears the cart.

If stock cannot be reserved, no order is created and any partial stock changes
are restored. No payment is collected; `paymentStatus` starts as `Pending`.

Order history supports `page`, `limit`, `status` and `sort=oldest|newest`.

### Admin orders — `/api/admin/orders`

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/admin/orders` | Paginated orders with `q`, `status`, `paymentStatus`, `page`, `limit`, `sort` |
| `GET` | `/api/admin/orders/:id` | Order detail with customer summary |
| `PATCH` | `/api/admin/orders/:id/status` | Update `{ status }` |

Valid statuses are `Pending`, `Processing`, `Packed`, `Shipped`,
`Out for delivery`, `Delivered` and `Cancelled`.

Cancelling an order restores stock. A COD order becomes `Paid` when marked
`Delivered`. If a paid order is cancelled, `paymentStatus` becomes `Refunded`
for bookkeeping only — actual refunds are handled manually because the Razorpay
refund API is not connected.

## React integration

| Screen | Service | Endpoints |
| --- | --- | --- |
| Cart quantities and persistence | `cartSlice.js` + `commerce.service.js` | `/cart` |
| Address book | `ManageAddressesPage.jsx` | `/account/addresses` |
| Checkout | `CheckoutPage.jsx` | `/account/addresses`, `/orders` |
| Order history | `MyOrdersPage.jsx` | `/orders` |
| Order detail | `OrderDetailsPage.jsx` | `/orders/:id` |
| Tracking | `OrderTrackingPage.jsx` | `/orders/:id/track` |
| Admin orders | `AdminOrdersPage.jsx` | `/admin/orders` |

Guest carts remain local in Redux. On sign-in, `syncGuestCart()` merges the local
items into the server cart through the cart API, then replaces local state with
the authoritative cart. Checkout is protected and redirects to sign-in.

## Still preview-only

- Coupons and discounts — client coupon UI removed; backend coupon APIs later.
- Razorpay order creation, verification and webhooks are implemented in
  [Phase 5](phase-5-payments.md) when keys are configured.
- AWS image uploads — Phase 6.
- Customer reviews, admin customers and sales reports — later phases.
- Delivery slots are local preview data; the selected label is saved on the order.
- Live rider location is not available; tracking shows real order status events.

## Verification

A backend smoke test covers customer registration, cart add, address create, COD
order creation, customer history/tracking, admin order list, status update and
cancellation with stock restoration. The client production build also passes.
