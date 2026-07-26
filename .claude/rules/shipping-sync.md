---
paths:
  - "src/shipping.js"
  - "functions/api/create-checkout-session.js"
---

# Shipping rates are duplicated — keep both in sync

The shipping model lives in **two** places and must match, because the client
shows the estimate and the server charges the authoritative amount:

- `src/shipping.js` — client-side, rates in **whole dollars** (`GA_RETAIL`).
- `functions/api/create-checkout-session.js` — server-side, rates in **cents**
  (`GA_RETAIL`).

Both copies also carry `REP_ZONE`, `SKU_WEIGHT_OZ`, `DEFAULT_ITEM_OZ`, and
`BOX_OZ`. When you change any of them, **edit both files** and keep the numbers
equivalent (dollars ↔ cents). If they drift, the checkout page quotes a
different price than the customer is charged.

## Current model: real USPS Ground Advantage retail, flat by weight

US only (`allowed_countries` locked to `US`). Package weight =
Σ(`SKU_WEIGHT_OZ[id]` × qty) + `BOX_OZ`, mapped to a USPS "weight not over"
tier. `GA_RETAIL` holds the **real USPS Ground Advantage — Retail** price for
every tier across zones 1–9 (Notice 123, effective **2026-07-12**).

Hosted Checkout fixes shipping **before** the customer enters their address, so
we can't know the real USPS zone. We charge the rate at a single representative
zone, **`REP_ZONE`** (default 5, middle of the country). Raise it to protect
margin on far shipments; lower it to be cheaper for nearby customers. Billing
the exact per-order zone would require collecting the destination ZIP on
`/checkout` before the Stripe redirect.

`SKU_WEIGHT_OZ` are **estimates** — confirm on a scale. Family Pack is 16 oz
(4 clips); the old model wrongly billed it as one 4 oz item.

## Sales tax (Stripe Tax)

Tax is **not** in these files — Stripe Tax computes it on the hosted page from
the customer's address. It's gated behind env `STRIPE_TAX_ENABLED="true"` and
turns on `automatic_tax` plus `tax_behavior`/`tax_code` on line items and
shipping. Enabling it before the Stripe dashboard is configured (Stripe Tax on,
origin address, tax registrations) makes Stripe reject every session.

## Verify after editing

`npm run build && npx wrangler pages dev dist --port 8788`, then POST a cart to
`/api/create-checkout-session` and confirm the returned Stripe session's
`total_details.amount_shipping` matches the on-page estimate. With
`STRIPE_TAX_ENABLED="true"`, also confirm `total_details.amount_tax` is set once
a US shipping address is entered.
