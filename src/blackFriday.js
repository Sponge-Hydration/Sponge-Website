// Black Friday 2026 offer: $10 off one Sponge, from now until the end of Black
// Friday (Fri Nov 27, 11:59 PM Pacific). One object so the offer, code and end
// time are typed in exactly one place.
//
// The discount itself is the Stripe promotion code BLACKFRIDAY10. While the
// sale runs, functions/api/create-checkout-session.js applies it to any cart
// with a tracker in it, so the shopper types nothing, and the cart page shows
// it as already applied. If the code is missing in Stripe, checkout falls back
// to the promo-code field and charges full price.
//
// No "was/now" or percent claim on purpose: $64.99 delivered is the real
// everyday price, so "$10 off" is the only claim the numbers support.

export const BLACK_FRIDAY = {
  // ON: Nathan confirmed BLACKFRIDAY10 is live in Stripe (11-23).
  // Set to false to hide the pop-up, hero pill and cart note.
  live: true,
  code: 'BLACKFRIDAY10',
  amountOff: 10,
  // Extended by Nathan 11-23 to run through Sunday.
  // 11:59:59 PM PST on Sun Nov 29 2026 = 07:59:59 UTC Mon Nov 30.
  endsAt: Date.parse('2026-11-30T07:59:59Z'),
  endsLabel: 'Sun, Nov 29',
  endsShort: 'Nov 29',
  deliveredPrice: 64.99, // same in both price-test arms (src/pricing.js)
}

// Trackers only: $10 off a $14.99 adhesive pack is not the offer.
export const BF_SKUS = ['sponge-clip', 'sponge-family']

/** Sale window by date alone. Safe on the server (no window). */
export function saleRunning(now = Date.now()) {
  return BLACK_FRIDAY.live && now < BLACK_FRIDAY.endsAt
}

export function cartQualifies(items) {
  return Array.isArray(items) && items.some((i) => BF_SKUS.includes(i?.id))
}

export const BF_OPEN_EVENT = 'sponge:bf-open'
export const BF_SEEN_KEY = 'sponge-bf-2026-seen'
export const BF_CODE_KEY = 'sponge-bf-code'

/** True only in the browser, before the offer ends. False while prerendering. */
export function blackFridayActive(now = Date.now()) {
  if (typeof window === 'undefined') return false
  // ?bf=1 previews the offer after it ends, for screenshots and QA.
  if (/[?&]bf=1\b/.test(window.location.search)) return true
  return BLACK_FRIDAY.live && now < BLACK_FRIDAY.endsAt
}

export function timeLeft(now = Date.now()) {
  const ms = Math.max(0, BLACK_FRIDAY.endsAt - now)
  const d = Math.floor(ms / 86400000)
  const h = Math.floor((ms % 86400000) / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return d > 0 ? `${d}d ${h}h` : `${h}h ${m}m`
}
