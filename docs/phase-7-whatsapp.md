# Phase 7 — WhatsApp Cloud API assistant

FreshCart can answer WhatsApp messages with the same grounded Gemini assistant used by the website chat. This phase is **catalog + FAQ only**: it can search live products, report prices/stock, recommend products, and answer delivery/payment questions. It cannot access carts, place orders, accept payments, or share personal account information.

All Meta and Gemini secrets stay on the server. The browser only sees the optional public business phone number used by the click-to-chat button.

## Architecture

```text
WhatsApp user
  -> Meta WhatsApp Cloud API webhook
     -> POST /api/whatsapp/webhook
        -> HMAC-SHA256 signature verification (X-Hub-Signature-256)
        -> deduplicate by Meta message ID in MongoDB
        -> acknowledge 200 immediately
        -> Gemini function calling via @google/genai
           -> live MongoDB catalog tools
           -> grounded store FAQ tool
        -> POST graph.facebook.com/{version}/{phone-number-id}/messages
```

Gemini receives no cart tools because `runAssistant()` is called without a user. Guests and WhatsApp users therefore get identical, safe capabilities.

## Meta setup (do this first)

1. Create a Meta app at <https://developers.facebook.com/apps/>.
2. Add the **WhatsApp** product to the app.
3. In **WhatsApp → API Setup**, note:
   - the test/sender **Phone number ID**
   - a temporary access token for initial testing
   - your test recipient number
4. In **App Settings → Basic**, note the **App Secret**.
5. Choose your own random **Verify token** string. It can be any value you invent; it is not issued by Meta.
6. Later, for production, create a **System User token** with WhatsApp messaging permissions and use a permanent token instead of the temporary one.

## Render environment variables

Add these to the FreshCart API web service:

```env
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_APP_SECRET=
# Optional; defaults to v27.0
WHATSAPP_API_VERSION=v27.0
```

The Gemini variables from the previous phase are also required:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=<your key>
GEMINI_MODEL=gemini-3.5-flash-lite
```

Restart/deploy after saving the variables. Check:

```text
https://freshcart-e-commerce-mern.onrender.com/api/whatsapp/status
```

Expected when fully configured:

```json
{
  "success": true,
  "data": {
    "configured": true,
    "webhookConfigured": true,
    "sendConfigured": true,
    "apiVersion": "v27.0"
  }
}
```

No token, secret, or phone number ID is returned by this endpoint.

## Webhook configuration

1. In Meta App Dashboard → **WhatsApp → Configuration**, set:

   ```text
   Callback URL: https://freshcart-e-commerce-mern.onrender.com/api/whatsapp/webhook
   Verify token: <the same value as WHATSAPP_VERIFY_TOKEN>
   ```

2. Save. Meta sends a `GET` request with `hub.mode`, `hub.challenge`, and `hub.verify_token`. The server returns the challenge only when the token matches.

3. Subscribe to the **`messages`** webhook field. Do not subscribe to unrelated fields unless you plan to handle them.

4. Send a test message from the configured test number. The webhook logs only non-secret status/error details.

### Signature and retries

Every `POST` is verified with:

```text
HMAC-SHA256(raw request body, WHATSAPP_APP_SECRET)
```

compared against `X-Hub-Signature-256: sha256=<hex>`. Invalid signatures are rejected with `400`.

Meta may retry a webhook for up to seven days. FreshCart stores each Meta message ID in MongoDB and ignores duplicates. The webhook responds `200` immediately; Gemini and the Cloud API send happen in the background.

## Cloudflare Pages / click-to-chat button

The floating WhatsApp button becomes a real `wa.me` link when this public variable is set in the Cloudflare Pages build environment:

```env
VITE_WHATSAPP_PHONE=919876543210
```

Use digits only, in E.164 format without `+`. This value is intentionally public. Leave it blank to keep the graceful “not available yet” toast.

Redeploy the frontend after adding it.

## 24-hour customer service window

WhatsApp allows free-form business replies only while the customer-service window is open (generally 24 hours after the customer's last message). Because the assistant replies directly to an inbound message, normal conversations fit this window.

If you later send proactive messages, alerts, or order updates outside that window, you must use approved Meta message templates. This phase does not send proactive messages.

## Local checks

```bash
cd server
npm run test:whatsapp
```

This verifies signature calculation, payload parsing, safe text chunking, and non-secret status output without contacting Meta.

## Manual test prompts

After configuring Meta and Render:

1. `hi`
2. `help`
3. `What vegetables are available?`
4. `Show fruits under ₹100`
5. `Which products are in stock?`
6. `Recommend a product under ₹200`
7. `How much is delivery?`
8. `Which payment methods are available?`
9. `What is in my cart?`

Expected:

- Prompts 3–8 return grounded live answers.
- Product names, prices, units, and stock come from MongoDB.
- Prompt 9 should **not** expose a cart; the assistant explains that cart actions are available in the website chat.
- No Meta/Gemini secret appears in logs, API responses, page source, or the client bundle.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `configured:false` from `/api/whatsapp/status` | Missing server env vars | Add all four WhatsApp variables and redeploy Render |
| Meta rejects webhook verification | Wrong verify token or callback URL | Use the exact URL above and the same `WHATSAPP_VERIFY_TOKEN` |
| `INVALID_WEBHOOK_SIGNATURE` | Wrong App Secret or body was modified | Use the App Secret from the same Meta app; keep raw body middleware |
| Webhook verified but no replies | `sendConfigured:false` or bad access token | Add a valid token and phone number ID; redeploy |
| ` (#131030) Message type not permitted` | Free-form reply outside 24h window | Reply inside the window or use an approved template |
| Duplicate replies | Deduplication DB unavailable | Ensure MongoDB is connected; check `WhatsAppMessage` records |
| Click-to-chat button shows toast | `VITE_WHATSAPP_PHONE` not set | Add the public number and redeploy Cloudflare Pages |

## Deferred in this phase

- Cart questions/actions over WhatsApp
- Account linking by phone number or one-time code
- Orders, checkout, payments, or refunds over WhatsApp
- Proactive order/shipping notifications using approved templates
- Media, location, and interactive-list messages
