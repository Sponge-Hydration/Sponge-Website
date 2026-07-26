// US-only shipping, priced with real USPS Ground Advantage RETAIL rates.
//
// ⚠️ MIRRORED: functions/api/create-checkout-session.js has a matching copy of
// this whole model (SKU_WEIGHT_OZ, BOX_OZ, REP_ZONE, GA_RETAIL) in CENTS. The
// SERVER is authoritative (it's what Stripe charges). Keep the two in sync.
//
// ── How pricing works ──────────────────────────────────────────────────────
// USPS Ground Advantage retail price depends on package WEIGHT and ZONE (zone =
// distance from our origin ZIP to the customer, 1=nearest … 9=farthest). But we
// use Stripe *hosted* Checkout, where the shipping amount is fixed when the
// session is created — BEFORE the customer types their address — so we can't
// know the real zone. We therefore charge a flat rate per weight tier taken from
// one representative zone (REP_ZONE). Change REP_ZONE to trade off:
//   lower zone (1–3) → cheaper, we may eat cost on far/coast-to-coast orders;
//   higher zone (7–9) → safer for us, overcharges nearby customers.
// Zone 5 is a middle-of-the-country default. To bill the EXACT zone per order,
// we'd need to collect the destination ZIP on /checkout before redirecting.
//
// Rates below are USPS Ground Advantage — Retail, Notice 123, effective
// 2026-07-12 (pe.usps.com). Update them when USPS changes prices.

// Representative USPS zone (1–9) used for the flat rate. See note above.
export const REP_ZONE = 5

// Per-SKU shipped product weight in ounces. ⚠️ ESTIMATES — confirm on a scale.
// Family Pack holds 4 clips, so it weighs ~4× a single (the old model wrongly
// treated it as one 4 oz item).
export const SKU_WEIGHT_OZ = {
  'sponge-clip': 4,
  'sponge-family': 16,
  'sponge-adhesive-3pack': 2,
}
const DEFAULT_ITEM_OZ = 4 // fallback for any unknown/retired SKU
export const BOX_OZ = 2 // packaging + padding added once per shipment

// USPS Ground Advantage — Retail price by weight tier and zone (US dollars).
// rates index 0..8 == zones 1..9. maxOz is the USPS "weight not over" break.
const GA_RETAIL = [
  { maxOz: 4, rates: [7.90, 8.05, 8.15, 8.30, 8.60, 8.75, 8.95, 9.45, 9.45] },
  { maxOz: 8, rates: [7.90, 8.05, 8.15, 8.30, 8.60, 8.75, 8.95, 9.45, 9.45] },
  { maxOz: 12, rates: [9.55, 9.95, 10.20, 10.60, 10.95, 11.35, 11.95, 12.90, 12.90] },
  { maxOz: 16, rates: [9.55, 9.95, 10.20, 10.60, 10.95, 11.35, 11.95, 12.90, 12.90] },
  { maxOz: 32, rates: [10.80, 11.50, 12.20, 13.00, 14.10, 15.10, 16.45, 19.05, 19.05] },
  { maxOz: 48, rates: [11.30, 12.00, 12.65, 13.70, 14.95, 16.45, 18.95, 22.40, 22.40] },
  { maxOz: 64, rates: [12.25, 12.75, 13.65, 14.85, 16.40, 18.30, 20.90, 24.25, 24.25] },
  { maxOz: 80, rates: [12.95, 13.55, 14.55, 15.80, 17.45, 19.60, 22.40, 26.05, 26.05] },
  { maxOz: 96, rates: [13.50, 13.90, 14.85, 16.35, 18.40, 21.05, 24.35, 28.35, 28.35] },
  { maxOz: 112, rates: [14.00, 14.40, 15.40, 17.10, 19.45, 22.55, 26.25, 30.60, 30.60] },
  { maxOz: 128, rates: [14.60, 14.85, 15.80, 17.65, 20.40, 24.10, 28.45, 33.15, 33.15] },
  { maxOz: 144, rates: [15.10, 15.40, 16.25, 18.30, 21.40, 25.55, 30.75, 35.70, 35.70] },
  { maxOz: 160, rates: [15.95, 16.30, 17.25, 19.40, 22.85, 27.50, 33.30, 39.45, 39.45] },
]

// Total shipped weight (oz) for a list of cart units. Each unit is one product;
// `id` selects its weight. One BOX_OZ is added for the whole shipment.
export function shipmentWeightOz(items) {
  const productOz = (items || []).reduce(
    (sum, i) => sum + (SKU_WEIGHT_OZ[i.id] ?? DEFAULT_ITEM_OZ) * (i.qty || 1),
    0
  )
  return productOz + BOX_OZ
}

// Flat shipping charge (US dollars) for a total package weight in ounces.
export function shippingForWeightOz(oz) {
  const tier = GA_RETAIL.find((t) => oz <= t.maxOz) || GA_RETAIL[GA_RETAIL.length - 1]
  return tier.rates[REP_ZONE - 1]
}

// Shipping charge (US dollars) for the cart. `items` is the array of cart units
// (each carries an `id`); pass `[{ id, qty }]` for grouped lines too.
export function shippingForCart(items) {
  if (!items || items.length === 0) return 0
  return shippingForWeightOz(shipmentWeightOz(items))
}
