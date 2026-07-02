# Order integrations (webhook side effects)

When Stripe fires `checkout.session.completed`, [`functions/api/webhook.js`](../functions/api/webhook.js)
runs three independent side effects (a failure in one does not block the others
or make Stripe retry):

1. **Append the order to a Google Sheet** (via the Sheets API + a service account)
2. **Email the customer** a confirmation (Gmail API)
3. **Email `team@spongehydration.com`** an "order received" notice (Gmail API)

Configure the env vars below in `.dev.vars` (local) and in the Cloudflare Pages
project settings (production). See [`.dev.vars.example`](../.dev.vars.example).

---

## 1. Google Sheet

Handled by [`functions/api/_sheets.js`](../functions/api/_sheets.js): the Worker
signs a JWT with a **service account** key, gets a Google access token, and
appends the order via the **Sheets API**. No Apps Script to deploy. It writes to
a new tab (`SHEET_TAB_NAME`, default "Sponge Orders"), auto-created with headers
on first order, so your legacy order tab stays untouched as an archive.

The row schema fits the current store: per-color clip counts (clips inside
multi-packs included), pack quantities, and a live **Days Since Delivered**
formula that stays blank until you fill in a Delivery Date.

### Setup

1. **Google Cloud Console** → select/create a project → **APIs & Services →
   Library** → enable **Google Sheets API**.
2. **Credentials → Create credentials → Service account** (e.g.
   `sponge-sheets-writer`). Skip the optional role/user steps → **Done**.
3. Open the service account → **Keys → Add key → Create new key → JSON**. This
   downloads the key file.
4. **Share the spreadsheet** with the service account's `client_email` (from the
   JSON), granting **Editor**. Without this the write is denied.
5. Set env vars from the JSON + the sheet URL:
   - `GOOGLE_SA_EMAIL` = `client_email`
   - `GOOGLE_SA_PRIVATE_KEY` = `private_key` (keep the `\n` escapes; wrap in
     double quotes in `.dev.vars`)
   - `GOOGLE_SHEET_ID` = the ID in the sheet URL
     (`/spreadsheets/d/<THIS>/edit`)
   - `SHEET_TAB_NAME` = `Sponge Orders` (optional)

> The private key is a credential — never commit it or paste it anywhere public.
> In Cloudflare Pages, add `GOOGLE_SA_PRIVATE_KEY` as an **encrypted** env var.

---

## 2 & 3. Gmail (customer + team emails)

Cloudflare Workers can't use SMTP, so we call the **Gmail API** with an OAuth2
refresh token. Emails send **as `team@spongehydration.com`**, so the authorized
account must be that mailbox, or have it set as a verified *Send as* alias
(Gmail → Settings → Accounts).

### One-time setup

1. **Google Cloud Console** → create/select a project → **APIs & Services →
   Library** → enable **Gmail API**.
2. **OAuth consent screen**: User type *External*; add the sending account under
   *Test users*; add scope `https://www.googleapis.com/auth/gmail.send`.
3. **Credentials → Create credentials → OAuth client ID** → type *Web
   application* → add redirect URI `https://developers.google.com/oauthplayground`.
   Copy the **Client ID** and **Client secret**.
4. **Get a refresh token** via the OAuth Playground:
   - Open <https://developers.google.com/oauthplayground>
   - Gear icon (top right) → check *Use your own OAuth credentials* → paste
     client ID + secret
   - Left panel → input scope `https://www.googleapis.com/auth/gmail.send` →
     **Authorize APIs** → sign in as the sending account → **Exchange
     authorization code for tokens**
   - Copy the **Refresh token**
5. Set env vars:
   - `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`
   - `ORDER_FROM_EMAIL` = `team@spongehydration.com`
   - `TEAM_EMAIL` = `team@spongehydration.com`

Gmail sending limits: ~500 messages/day (consumer) or ~2,000/day (Workspace).
Fine at launch volume; move to a transactional provider if you outgrow it.

---

## Local end-to-end test

1. `stripe login`
2. `stripe listen --forward-to localhost:8788/api/webhook` → paste the
   `whsec_...` into `.dev.vars` as `STRIPE_WEBHOOK_SECRET`.
3. `npm run build && npx wrangler pages dev dist --port 8788`
4. Place a test order at <http://localhost:8788> with card `4242 4242 4242 4242`.
5. Confirm: a new sheet row, a customer email, and a team email. The Wrangler log
   shows `↳ sheet: ok`, `↳ customerEmail: ok`, `↳ teamEmail: ok`.

## Production (Cloudflare Pages)

- Add **all** the env vars above to the Pages project (Settings → Environment
  variables), alongside `STRIPE_SECRET_KEY`.
- In the **Stripe Dashboard → Developers → Webhooks**, add an endpoint
  `https://<your-domain>/api/webhook` for event `checkout.session.completed`, and
  put its signing secret in `STRIPE_WEBHOOK_SECRET`.
