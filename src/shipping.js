// US-only shipping (USPS Ground Advantage), priced by total package weight.
//
// ⚠️ The SERVER is authoritative, functions/api/create-checkout-session.js has
// a matching copy of PER_ITEM_OZ and TIERS. Keep the two in sync.
//
// Note: true USPS Ground rates also vary by destination zone (distance), which
// needs a USPS zone lookup we don't have. These are flat US rates per weight
// tier, edit them to your real USPS Ground Advantage prices.

export const PER_ITEM_OZ = 4 // each product weighs 4 oz

// Rate (whole US dollars) by total order weight in ounces.
const TIERS = [
  { maxOz: 8, rate: 5.0 }, // up to 2 items
  { maxOz: 16, rate: 6.0 }, // up to 4 items (< 1 lb)
  { maxOz: 48, rate: 9.0 }, // up to 3 lb
  { maxOz: Infinity, rate: 12.0 },
]

// itemCount = number of products in the cart (each weighs PER_ITEM_OZ).
export function shippingForItems(itemCount) {
  const oz = Math.max(1, itemCount) * PER_ITEM_OZ
  return (TIERS.find((t) => oz <= t.maxOz) || TIERS[TIERS.length - 1]).rate
}
