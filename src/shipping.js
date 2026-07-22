// Client-side shipping estimate shown on the checkout page.
//
// ⚠️ The SERVER is authoritative — functions/api/create-checkout-session.js has
// a matching copy of these rates (in cents). Keep the two in sync. Edit the
// ZONES numbers below (and the mirror in that file) to your real shipping rates.

export const SHIP_COUNTRIES = [
  { code: 'US', label: 'United States' },
  { code: 'CA', label: 'Canada' },
]

// Rates in whole US dollars. freeOver = free shipping at/above this subtotal.
const ZONES = {
  US: { flat: 4.99, freeOver: 75 },
  CA: { flat: 14.99, freeOver: 150 },
}

export function isShippableCountry(code) {
  return SHIP_COUNTRIES.some((c) => c.code === code)
}

// subtotal is in whole dollars (matches useCart's subtotal).
export function shippingQuote(country, subtotal) {
  const z = ZONES[country] || ZONES.US
  if (z.freeOver != null && subtotal >= z.freeOver) return 0
  return z.flat
}
