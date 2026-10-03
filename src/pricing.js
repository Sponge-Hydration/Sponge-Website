// Price A/B test: does "free shipping" or a lower sticker price sell better?
//
//   A: Sponge Tracker $64.99, FREE shipping on every order
//   B: Sponge Tracker $59.99, flat $5 shipping on every order
//
// For one tracker both come to $64.99 delivered (before tax), so the test is
// about framing, not price level. Other products keep their normal prices; the
// shipping rule applies to the whole order in both arms.
//
// Assignment happens in an inline script in index.html's <head>, before first
// paint: random 50/50 on the first visit, then remembered for a year in the
// `sponge_ab_price` cookie (+ localStorage), so a returning visitor always sees
// the same price. Crawlers are always given B. The script stamps
// <html data-price="ab-a|ab-b">; CSS shows the matching half of every <AB>
// price in the page, so there is no flash of the wrong price.
//
// ⚠️ MIRRORED: functions/api/_pricing.js has PRICE_TEST in cents.
// The server is authoritative (it is what Stripe charges). Keep the two in sync
// (test/price-test.test.js checks it).
//
// The weight-based USPS model in src/shipping.js is untouched and unused while
// the test runs, so ending it is a small change.

export const AB_COOKIE = 'sponge_ab_price'
export const AB_STORAGE = 'sponge-ab-price'
export const TEST_SKU = 'sponge-clip'

export const PRICE_TEST = {
  A: { trackerPrice: 64.99, shipping: 0 },
  B: { trackerPrice: 59.99, shipping: 5 },
}

const valid = (v) => v === 'A' || v === 'B'

/** The visitor's arm. 'B' during prerender and whenever nothing is assigned. */
export function getPriceVariant() {
  if (typeof document === 'undefined') return 'B'
  const attr = document.documentElement.getAttribute('data-price')
  if (attr === 'ab-a') return 'A'
  if (attr === 'ab-b') return 'B'
  const m = document.cookie.match(/(?:^|; )sponge_ab_price=([AB])/)
  return m && valid(m[1]) ? m[1] : 'B'
}

/** Unit price for a product in this arm (only the Tracker changes). */
export function priceFor(product, variant = getPriceVariant()) {
  if (!product) return 0
  return product.id === TEST_SKU ? PRICE_TEST[variant].trackerPrice : product.price
}

/** Shipping for the whole cart in this arm: A free, B flat $5. */
export function cartShipping(items, variant = getPriceVariant()) {
  return items && items.length ? PRICE_TEST[variant].shipping : 0
}
