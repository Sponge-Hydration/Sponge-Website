---
paths:
  - "src/shipping.js"
  - "functions/api/create-checkout-session.js"
---

# Shipping rates are duplicated — keep both in sync

The shipping rate logic lives in **two** places and must match, because the
client shows the estimate and the server charges the authoritative amount:

- `src/shipping.js` — client-side, rates in **whole dollars** (`TIERS`, `PER_ITEM_OZ`).
- `functions/api/create-checkout-session.js` — server-side, rates in **cents**
  (`SHIP_TIERS`, `PER_ITEM_OZ`).

When you change a rate, a weight tier, or `PER_ITEM_OZ`, **edit both files** and
keep the numbers equivalent (dollars ↔ cents). If they drift, the checkout page
will quote a different price than the customer is actually charged.

Current model: **US only** (`allowed_countries` locked to `US`), priced by total
order weight = item count × `PER_ITEM_OZ` (4 oz), flat per weight tier (no USPS
zone/distance factor — that would need a USPS zone lookup we don't have).

After editing, verify: `npm run build && npx wrangler pages dev dist --port 8788`,
then POST a cart to `/api/create-checkout-session` and confirm the returned
Stripe session's `total_details.amount_shipping` matches the on-page estimate.
