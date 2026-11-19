# Phase 5 — Razorpay payments

Phase 5 adds real Razorpay checkout for FreshCart. COD remains unchanged. No
screen marks an order as paid from a browser callback alone: the server verifies
a signed response, checks the payment with Razorpay, and then updates the order.

## What changed

- Server-side Razorpay order creation for the current cart.
- Signed checkout verification with `razorpay_order_id|razorpay_payment_id`.
- Razorpay webhook handling for `payment.captured`, `payment.authorized` and
  `payment.failed`.
- Failed-payment state with a retry button on order details.
- Payment success and failure pages that read the real order from the API.
- Admin order list shows `Paid`, `Failed` and `Refunded` payment states.

## Security rules

- `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` stay on the server.
- The browser only receives the public key ID, amount, currency and Razorpay
  order ID.
- Signatures are compared with a timing-safe HMAC check.
- Payment amount, currency and order ID are checked against the saved order.
- A payment arriving after cancellation is recorded as `Refunded` for manual
  bookkeeping; automatic refund APIs are not part of Phase 5.
- The webhook uses the exact raw request body, not a re-serialized JSON object.

## Endpoints

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/payments/config` | Public | Public key ID, currency and enabled flag |
| `POST` | `/api/create-order` | Customer | Primary create endpoint (cart checkout or direct Razorpay order) |
| `POST` | `/api/verify-payment` | Customer | Primary verification endpoint (signed response, optional order confirmation) |
| `POST` | `/api/payments/orders` | Customer | Backwards-compatible internal-order endpoint |
| `POST` | `/api/payments/verify` | Customer | Backwards-compatible verification endpoint |
| `POST` | `/api/payments/orders/:id/retry` | Customer | Create a fresh Razorpay order for an unpaid order |
| `POST` | `/api/payments/webhook` | Signed by Razorpay | Process capture and failure events |

The checkout UI uses `/api/create-order` and `/api/verify-payment`. Both `/api/payments/*`
create/verify routes remain available and delegate to the same payment service.

### Requested endpoint contracts

`POST /api/create-order` accepts either the full checkout payload shown below,
or a direct provider order request:

```json
{
  "amount": 50000,
  "currency": "INR",
  "receipt": "fc_order_receipt"
}
```

`amount` must be an integer of at least `100` paise and `receipt` cannot exceed
40 characters. Authenticated requests receive `401` without a valid session;
Razorpay API failures return `500`. A direct request creates only a Razorpay
order and never marks a FreshCart order as paid.

`POST /api/verify-payment` accepts the three Razorpay checkout fields:

```json
{
  "razorpay_order_id": "order_...",
  "razorpay_payment_id": "pay_...",
  "razorpay_signature": "..."
}
```

The server verifies `order_id|payment_id` with `KEY_SECRET`. Missing or invalid
fields return `400`. Add a valid `orderId` to also confirm the matching internal
order, exactly as `/api/payments/verify` does.

### Create an online order

```json
{
  "addressId": "69...",
  "paymentMethod": "razorpay",
  "deliverySlot": "Tomorrow, 10 AM - 12 PM"
}
```

The server:

1. Revalidates the cart, address and stock.
2. Creates the internal FreshCart order.
3. Creates the Razorpay order. If this fails, stock is restored and the internal
   order is removed.
4. Clears the cart.
5. Returns `orderId`, `orderNumber`, `razorpayOrderId`, `keyId`, `amount` and
   `currency`.

`amount` is in the smallest currency unit (paise for INR).

### Verify a payment

The browser sends the Razorpay handler fields plus the internal order ID:

```json
{
  "orderId": "69...",
  "razorpay_order_id": "order_...",
  "razorpay_payment_id": "pay_...",
  "razorpay_signature": "..."
}
```

On success, `paymentStatus` becomes `Paid` and a pending order moves to
`Processing`. The operation is idempotent if a webhook already recorded it.

## Manual setup you need to do

### 1. Get Razorpay test keys

1. Sign in to the [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Make sure **Test Mode** is selected in the top-left mode switch. Never use
   live keys for local development.
3. Open **Settings → API Keys**.
4. Generate a test key if one does not exist.
5. Copy the **Key ID** and **Key Secret**.

Do not paste the secret into chat, screenshots, Git or client code.

### 2. Create a local webhook URL

Razorpay cannot reach `localhost`, so expose the API temporarily:

```bash
npx ngrok http 5000
```

If ngrok asks for a token:

```bash
npx ngrok config add-authtoken YOUR_NGROK_TOKEN
npx ngrok http 5000
```

Copy the `https://...ngrok-free.app` URL from the terminal.

### 3. Add the Razorpay webhook

1. In Razorpay Dashboard, stay in **Test Mode**.
2. Open **Settings → Webhooks → Add Webhook**.
3. Set the URL to:

   ```text
   https://YOUR-NGROK-URL/api/payments/webhook
   ```

4. Select these events:

   - `payment.captured`
   - `payment.failed`

   `payment.authorized` is also handled by the server if you enable it.
5. Create your own long random webhook secret and enter it in the dashboard.
6. Copy that same secret for the server `.env` file.

For a deployed API, use the real public URL instead of ngrok. Webhooks are
required when any Razorpay key is configured in production.

### 4. Add server environment variables

Open `freshcart/server/.env` and append:

```dotenv
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_test_key_secret
RAZORPAY_WEBHOOK_SECRET=the_same_secret_you_put_in_the_dashboard
RAZORPAY_CURRENCY=INR
```

`server/.env` is ignored by Git. Do not rename it to anything tracked.

### 5. Restart the API

If you run the API yourself, stop it with `Ctrl + C` and start it again:

```bash
cd freshcart/server
npm run dev
```

If you are using the API process started by the agent, ask the agent to restart
it after you add the keys.

### 6. Confirm configuration

```bash
curl http://localhost:5000/api/payments/config
```

Expected:

```json
{
  "success": true,
  "data": { "enabled": true, "keyId": "rzp_test_...", "currency": "INR" }
}
```

If `enabled` is `false`, a key is missing or the API was not restarted.

### 7. Test a successful payment in the UI

1. Hard-refresh the site with `Ctrl + Shift + R`.
2. Register or log in as a customer.
3. Add a product to the cart.
4. Make sure `/account/addresses` has a saved address.
5. Open `/checkout`, select **Razorpay**, then click **Pay with Razorpay**.
6. In the Razorpay modal, choose **Card** and enter:

   ```text
   Card number: 4100 2800 0000 1007
   Expiry:      any future date
   CVV:         any random 3 digits
   OTP:         any 4-10 digit number
   ```

7. Submit the OTP and choose the success option on the mock bank page.
8. Confirm:
   - the site shows the verified payment success page;
   - `/account/orders/:id` shows `Paid` and a payment ID;
   - the cart is empty and stock was reduced;
   - `/admin/orders` shows `Paid` and `Processing`.

### 8. Test a failed payment and retry

1. Place another online order.
2. Use this decline card:

   ```text
   Card number: 4100 2800 0006 0003
   Expiry:      any future date
   CVV:         any random 3 digits
   ```

3. Choose the failure option on the mock bank page.
4. Confirm the failure page shows the server payment status and an order link.
5. Open that order and click **Pay now** to create a fresh Razorpay order.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Razorpay tile says “Not configured” | Missing keys or stale API process | Add keys to `server/.env`, restart API, hard-refresh UI |
| `PAYMENTS_NOT_CONFIGURED` | Keys absent in server environment | Complete step 4 and restart |
| `INVALID_PAYMENT_SIGNATURE` | Key secret does not match the Razorpay account | Recopy the test key secret |
| Webhook not reached | ngrok stopped or wrong URL | Restart ngrok and update the dashboard URL |
| Payment paid but order still pending | Webhook secret mismatch or ngrok offline | Verify response normally updates it; check webhook logs and retry from order details |

## Still not included

- Automatic refunds and settlements
- Live-mode keys in local development
- Payment method save/tokenization UI
- Sales reports built from paid orders
- Razorpay payouts and route optimization
