// Underscore-prefixed, so Cloudflare Pages does not route it.
//
// Price A/B test (src/pricing.js has the rationale and the dollar copy).
// ⚠️ MIRRORED with src/pricing.js PRICE_TEST; test/price-test.test.js checks it.
//   A: Tracker $64.99, free shipping on every order
//   B: Tracker $59.99, flat $5 shipping on every order
// The arm comes from the client (body.priceVariant, else the sponge_ab_price
// cookie, else B). Both arms are public offers, so trusting the client is fine:
// the point is that Stripe charges exactly the price that visitor was shown.
// While the test runs, the weight-based USPS rate in create-checkout-session.js
// is not charged.
export const PRICE_TEST = {
  A: { trackerAmount: 6499, shippingAmount: 0, shippingName: 'Free shipping (USPS Ground Advantage)' },
  B: { trackerAmount: 5999, shippingAmount: 500, shippingName: 'USPS Ground Advantage' },
}
export const TEST_SKU = 'sponge-clip'

export function priceVariantFor(request, body) {
  const v = body?.priceVariant
  if (v === 'A' || v === 'B') return v
  const m = (request.headers.get('cookie') || '').match(/(?:^|;\s*)sponge_ab_price=([AB])/)
  return m ? m[1] : 'B'
}
