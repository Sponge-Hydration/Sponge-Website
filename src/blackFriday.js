// Black Friday 2026 offer: $10 off one Sponge, from now until the end of Black
// Friday (Fri Nov 27, 11:59 PM Pacific). One object so the offer, code and end
// time are typed in exactly one place.
//
// ⚠️ The site only ADVERTISES the offer. The discount itself is a Stripe
// promotion code (Stripe Checkout already shows the promo-code field, see
// functions/api/create-checkout-session.js). Create BLACKFRIDAY10 in Stripe
// ($10 off, expires at ENDS) before this ships, or the pop-up promises a
// discount checkout will not give.
//
// No "was/now" or percent claim on purpose: $64.99 delivered is the real
// everyday price, so "$10 off" is the only claim the numbers support.

export const BLACK_FRIDAY = {
  // ON: Nathan confirmed BLACKFRIDAY10 is live in Stripe (11-23).
  // Set to false to hide the pop-up, hero pill and cart note.
  live: true,
  code: 'BLACKFRIDAY10',
  amountOff: 10,
  // 11:59:59 PM PST on Fri Nov 27 2026 = 07:59:59 UTC Sat Nov 28.
  endsAt: Date.parse('2026-11-28T07:59:59Z'),
  endsLabel: 'Fri, Nov 27',
  deliveredPrice: 64.99, // same in both price-test arms (src/pricing.js)
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
