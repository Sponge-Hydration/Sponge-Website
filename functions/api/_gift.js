// "Mystery gift" for new email subscribers: a unique, single-use 10% discount.
//
// Every code is its own Stripe promotion code attached to ONE shared coupon
// (10% off, duration "once"). Single use is enforced by Stripe itself via
// max_redemptions=1: the moment one checkout completes with a code, Stripe
// marks it used and rejects it everywhere after. Customers enter it in the
// promotion-code field on Stripe Checkout, which create-checkout-session.js
// switches on with allow_promotion_codes.
//
// Underscore-prefixed, so Cloudflare Pages does not route it.
//
// Env vars:
//   STRIPE_SECRET_KEY  - already set for checkout
//   SIGNUP_COUPON_ID   - id of the 10%-off coupon, created once in the Stripe
//                        dashboard (Product catalogue > Coupons > 10% off,
//                        Duration: Once). No coupon id = no gift, signup still works.

// Pinned so the promotion-code request shape can't change under us if the
// account's default API version is upgraded (newer versions move `coupon`
// under a `promotion` object).
const STRIPE_VERSION = '2024-06-20'

// No 0/O or 1/I lookalikes, so a code read off a phone screen is typed right.
// 32 symbols divides 256 evenly, so byte % 32 has no modulo bias.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function giftConfigured(env) {
  return Boolean(env.STRIPE_SECRET_KEY && env.SIGNUP_COUPON_ID)
}

export function randomCode(len = 8, prefix = 'GIFT') {
  const bytes = new Uint8Array(len)
  crypto.getRandomValues(bytes)
  let s = ''
  for (const b of bytes) s += ALPHABET[b % ALPHABET.length]
  return `${prefix}-${s}`
}

// Creates one single-use promotion code and returns its customer-facing code.
// Retries once on a code collision (32^8 space, so this is belt and braces).
// Options (all optional; defaults are the signup gift):
//   coupon    - coupon id (default SIGNUP_COUPON_ID)
//   prefix    - code prefix (default "GIFT")
//   source    - metadata[source] (default "email-signup-gift")
//   expiresAt - unix seconds after which Stripe rejects the code
//   metadata  - extra metadata fields
export async function createGiftCode(env, { email, coupon, prefix, source, expiresAt, metadata } = {}) {
  let lastError = 'unknown error'
  for (let attempt = 0; attempt < 2; attempt++) {
    const code = randomCode(8, prefix || 'GIFT')
    const form = new URLSearchParams()
    form.set('coupon', coupon || env.SIGNUP_COUPON_ID)
    form.set('code', code)
    form.set('max_redemptions', '1')
    form.set('metadata[source]', source || 'email-signup-gift')
    if (expiresAt) form.set('expires_at', String(expiresAt))
    for (const [k, v] of Object.entries(metadata || {})) form.set(`metadata[${k}]`, String(v))
    // Lets support look up "I lost my code" in the Stripe dashboard.
    if (email) form.set('metadata[email]', email)

    const res = await fetch('https://api.stripe.com/v1/promotion_codes', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        'content-type': 'application/x-www-form-urlencoded',
        'Stripe-Version': STRIPE_VERSION,
      },
      body: form,
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok && data.code) return data.code

    lastError = data?.error?.message || `Stripe ${res.status}`
    // Only a duplicate code is worth retrying; anything else is a real fault.
    if (!/already exists/i.test(lastError)) break
  }
  throw new Error(`could not create gift code: ${lastError}`)
}
