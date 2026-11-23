# WhatsApp click-to-chat and Share Cart

FreshCart uses WhatsApp as a **manual handoff channel**. The website opens a `wa.me`
chat with a pre-filled message; the customer decides whether to press **Send**.
Nothing is sent automatically, and FreshCart does not receive or answer incoming
WhatsApp messages.

> Meta Cloud API automation, webhooks, access tokens and message templates are
> intentionally not part of the current project. The formatting utility is kept
> transport-agnostic so a future official Cloud API integration can reuse the
> cart/order systems without rewriting them.

## What works

- **Click-to-chat** from the floating WhatsApp button: opens a pre-filled general
  shopping enquiry.
- **Share cart on WhatsApp** from `/cart` and `/checkout`: includes live product
  names, quantities, unit prices, line totals and the cart total.
- At checkout, the shared message also includes the selected delivery date,
  time slot, confirmed address and delivery instructions **only when supplied**.
- Prices and totals come from the Redux cart, which is synchronized with the
  server-calculated cart snapshot. The browser never supplies prices to an API.

## Configuration

The business number is public. FreshCart ships with a built-in fallback
(`7812841311`, normalized to `917812841311`) so the buttons work even when no
environment variable is configured. Override it in `client/.env`:

```env
VITE_WHATSAPP_PHONE=919876543210
```

Use digits only, in E.164 format without `+`. A 10-digit Indian mobile number is
also accepted and FreshCart adds `+91` automatically. Cloudflare Pages and any
other deployment must set the same variable as a build-time environment variable
to override the fallback, then redeploy the frontend.

No Meta credentials belong in `server/.env`. The server has no WhatsApp routes,
webhooks, tokens or database message records.

## Example generated message

```text
Hi FreshCart! Please confirm my cart order.

1. Amul Milk × 2 — ₹70 each = ₹140
2. Bananas × 1 — ₹45 each = ₹45

Subtotal: ₹185
Delivery: ₹30
Cart total: ₹215

Delivery details:
Date: 2026-11-24
Time slot: Tue, 24 Nov, 8:00 AM – 10:00 AM
Address: Jane Doe, 12 Main Street, Bengaluru, Karnataka 560001
Instructions: Leave at the door.

Please confirm availability and next steps. Thank you!
```

The link encodes the message with `encodeURIComponent`; WhatsApp displays it in
the composer. FreshCart cannot verify whether the customer sends it.

## Local checks

```bash
cd server
npm run test:whatsapp-share
```

The test verifies message formatting, URL encoding, conditional delivery fields,
empty-cart handling and that all computed prices come from the supplied cart.

## Future Cloud API compatibility

If official inbound automation is added later, implement a new transport layer
that calls the existing assistant and cart/order services. Do not reintroduce
unused Meta variables, do not trust phone numbers as identity, and do not allow
WhatsApp messages to mutate carts or orders without the same authentication and
confirmation rules used by the website.
