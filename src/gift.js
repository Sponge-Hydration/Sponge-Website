// Signup-gift links. The gift email's button opens the site with ?gift=CODE;
// we remember the code so checkout can apply it automatically and the shopper
// never has to type it. Only people we emailed a code to ever have such a link.
//
// The server re-validates the code against Stripe before applying anything
// (functions/api/create-checkout-session.js), so this is only a convenience.
//
// SSG-safe: nothing touches window/localStorage at module scope.

export const GIFT_KEY = 'sponge-gift-code-v1'
// Same alphabet as functions/api/_gift.js (no 0/O/1/I).
export const GIFT_RE = /^GIFT-[A-HJ-NP-Z2-9]{8}$/

/** Reads ?gift=CODE from the URL, if present and well-formed, and stores it. */
export function captureGiftFromUrl() {
  if (typeof window === 'undefined') return
  let code
  try {
    code = new URLSearchParams(window.location.search).get('gift')
  } catch {
    return
  }
  code = String(code || '').trim().toUpperCase()
  if (!GIFT_RE.test(code)) return
  try {
    localStorage.setItem(GIFT_KEY, code)
  } catch {
    /* storage blocked: they can still type the code at checkout */
  }
}

export function getGiftCode() {
  if (typeof window === 'undefined') return ''
  try {
    const code = localStorage.getItem(GIFT_KEY) || ''
    return GIFT_RE.test(code) ? code : ''
  } catch {
    return ''
  }
}

export function clearGiftCode() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(GIFT_KEY)
  } catch {
    /* ignore */
  }
}
