# Gemini AI shopping assistant

FreshCart's assistant uses Google Gemini through the official server-side SDK
`@google/genai`. The browser only talks to FreshCart's own `/api/ai/*` endpoints;
the Gemini API key is never sent to the client.

## Architecture

```text
React chat UI
  -> POST /api/ai/chat
     -> optionalAuth (guest or signed-in customer)
     -> Gemini function calling via @google/genai
        -> live MongoDB catalog tools
        -> existing cart service (signed-in customers only)
        -> grounded store FAQ facts
```

The assistant is stateless. Chat history sent by the browser is limited to the
last 8 messages. During a tool loop, the exact Gemini model content (including
function-call IDs and thinking signatures) is passed back to Gemini as required
by Gemini 3+ function calling.

## Environment variables

Use these exact names in `server/.env` and on Render:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash-lite
AI_TIMEOUT_MS=20000
AI_MAX_TOOL_ROUNDS=6
AI_RATE_LIMIT_WINDOW_MS=900000
AI_RATE_LIMIT_MAX=30
```

`gemini-3.5-flash-lite` is a stable, free-tier, low-latency model that supports
function calling. Confirm that it is available in your Google AI Studio project.
If it is not listed, use `gemini-3.8-flash`, which is also free-tier and supports
function calling.

Remove or unset these obsolete OpenAI variables anywhere they are configured:

```env
AI_API_KEY
AI_MODEL
AI_API_BASE_URL
AI_REASONING_EFFORT
```

Leave `GEMINI_API_KEY` blank to keep the assistant gracefully disabled. The rest
of FreshCart continues to work normally.

## Local setup

1. Use Node.js 22 or newer (`@google/genai` requires Node 22+).

   ```bash
   node --version
   ```

2. Install server dependencies:

   ```bash
   cd server
   npm install
   ```

3. Copy the example environment file if you do not already have one:

   ```bash
   # Windows PowerShell
   Copy-Item .env.example .env
   ```

4. Set the Gemini variables shown above in `server/.env`.

5. Restart both the API and the Vite dev server.

6. Check status:

   ```bash
   curl http://localhost:5000/api/ai/status
   ```

   Expected shape:

   ```json
   {
     "success": true,
     "data": {
       "configured": true,
       "provider": "gemini",
       "model": "gemini-3.5-flash-lite",
       "providerValid": true,
       "keyPresent": true
     }
   }
   ```

## Render deployment

1. Open the FreshCart API service in Render.
2. Set **Runtime** to Node 22 or newer. If the service uses a `render.yaml` or
   `engines` field, update that to Node 22 too.
3. Add/verify these environment variables in the Render dashboard:

   ```env
   AI_PROVIDER=gemini
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-3.5-flash-lite
   ```

4. Delete the obsolete `AI_API_KEY`, `AI_MODEL`, `AI_API_BASE_URL`, and
   `AI_REASONING_EFFORT` variables.
5. Deploy the Render service.
6. Verify the public status endpoint:

   ```text
   https://freshcart-e-commerce-mern.onrender.com/api/ai/status
   ```

7. In Google AI Studio, confirm the key belongs to the project where
   `gemini-3.5-flash-lite` (or your chosen fallback model) is available.

## Cloudflare Pages deployment

The frontend needs no Gemini variables. After Render is verified, redeploy or
purge the Cloudflare Pages cache and hard-refresh the site. The chat UI reads
only `/api/ai/status` and `/api/ai/chat` from the Render API.

## Available tools

| Capability | Tool | Availability |
| --- | --- | --- |
| Product discovery | `search_products` | Everyone |
| Category discovery | `list_categories` | Everyone |
| Product details | `get_product_details` | Everyone |
| Stock availability | `check_stock` | Everyone |
| Recommendations | `recommend_products` | Everyone |
| Delivery/payment/order FAQs | `get_store_faqs` | Everyone |
| Cart questions/total | `view_cart` | Signed-in customers |
| Prepare cart change | `prepare_cart_change` | Signed-in customers |
| Commit cart change | server-side confirmation handler | Signed-in customers, after explicit confirmation |
| Recent orders | `get_my_orders` | Signed-in customers, read-only |
| One order | `get_order_details` | Signed-in customers, read-only, ownership checked |

Catalog answers are grounded in live MongoDB data. The assistant is instructed
not to invent products, prices, discounts, stock, delivery times, or policies.
Every cart mutation first calls `prepare_cart_change`, which validates the
product, current cart state and stock, then returns an opaque signed confirmation
summary. The assistant asks the customer to confirm before anything changes. On
the next message, FreshCart validates the signed confirmation and commits the
prepared change through the existing cart service functions used by
`POST /api/cart/items`, `PATCH /api/cart/items/:id`,
`DELETE /api/cart/items/:id`, and `DELETE /api/cart`, including server-side price
and cumulative stock checks. Commit results include a cart snapshot so the React
client can refresh Redux immediately. The browser only returns the signed token
when the customer presses **Confirm change** or sends a clear affirmative reply;
an unrelated follow-up question never commits the prepared change. Commit tools
are not exposed to the model; only the read-only prepare step is.

Guests can use catalog and FAQ tools. If a guest asks a cart or order question,
the assistant asks them to sign in. Cart and order tools are not advertised to
guests, and no user ID is accepted from the browser. Order tools use the existing
ownership-scoped order service and never expose another customer's information.

## Security notes

- `GEMINI_API_KEY` is read only by `server/config/env.js` and passed only to the
  Gemini SDK on the server.
- `/api/ai/status` returns only `configured`, `provider`, `model`, plus the
  non-secret booleans `providerValid` and `keyPresent` — never the key or full
  environment. Use those booleans to diagnose a misconfigured deployment.
- Provider errors are logged server-side in a generic form. Clients receive
  generic `AI_*` error codes and customer-safe messages.
- `/api/ai/chat` keeps the existing IP-based AI rate limit.
- Consumed confirmation tokens are recorded in MongoDB with a unique `jti`, so
  a token cannot be replayed on another server instance before it expires.
- Commit tools are rejected by the tool executor unless the request carries an
  explicit client approval flag and a valid signed token. The browser only sets
  that flag from the **Confirm change** button or an exact affirmative reply.
- `optionalAuth` ignores invalid tokens on this public route rather than
  granting cart capabilities.

## Manual verification prompts

Use the floating assistant on the customer site and try:

1. `Show available vegetables.`
2. `Find fruits under ₹100.`
3. `Recommend daily essentials.`
4. `Show products currently in stock.`
5. `Tell me about Amul Milk.`
6. `Help me with my cart.`
7. `What is in my cart?` (signed in)
8. `Add 2 Amul Milk to my cart` (signed in; confirm when asked, then open the cart)
9. `Change that item to 3` (signed in; confirm when asked)
10. `Show my recent orders` (signed in)

Expected behavior:

- Product names, prices, units, and stock come from the live catalog.
- No answer invents a product, offer, delivery promise, or payment policy.
- The exact welcome message and six suggested prompts match the product requirement.
- Cart changes require explicit confirmation; the cart UI updates after a confirmed change.
- Signed-in users can add AI-recommended products from the product cards.
- Guests are asked to sign in for cart and order questions.
- No API key appears in responses, page source, or the client bundle.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `configured: false`, `keyPresent: false` | `GEMINI_API_KEY` did not reach the server process | Add the exact variable to the correct service and redeploy/restart |
| `configured: false`, `keyPresent: true`, `providerValid: false` | `AI_PROVIDER` is not exactly `gemini` | Replace its value with `gemini`, removing quotes/spaces, then redeploy |
| Startup log `Assistant disabled. providerValid=… keyPresent=…` | Same diagnosis without calling the API | Use the booleans above to find the missing variable |
| `404`/`not found` model error | Model unavailable in the AI Studio project | Use `gemini-3.8-flash` in `GEMINI_MODEL` |
| `AI_TOOL_LIMIT` | The assistant needed more lookup rounds than allowed | Rephrase with a narrower query; admins can raise `AI_MAX_TOOL_ROUNDS` |
| `429` / rate limit | Free-tier project rate limit reached | Retry later or lower traffic; no billing is configured |
| Cart tools not used | Request is a guest or token expired | Sign in again and retry |
| `AI_TIMEOUT` | Gemini took longer than `AI_TIMEOUT_MS` | Increase the timeout modestly and retry |
