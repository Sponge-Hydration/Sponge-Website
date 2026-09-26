// Abandoned-cart recovery. What must hold:
//  - only shoppers who opted in to offers get an email (Stripe's rule);
//  - never twice for one session, at most once per address per 30 days;
//  - nobody who has since bought gets one;
//  - the code is single-use, 10%, expiring, and the email links the recovery URL;
//  - checkout asks Stripe for recovery, and falls back cleanly if refused.

import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../functions/api/_integrations.js', async (orig) => {
  const real = await orig()
  return { ...real, gmailConfigured: () => true, sendGmail: vi.fn(async () => ({})) }
})
vi.mock('../functions/api/_google-sa.js', () => ({
  serviceAccountConfigured: () => false,
  getGoogleAccessToken: vi.fn(),
}))

const { sendGmail } = await import('../functions/api/_integrations.js')
const { skipReason, handleCheckoutExpired, recoveryEmailHtml } = await import('../functions/api/_recovery.js')
const { onRequestPost: createCheckout } = await import('../functions/api/create-checkout-session.js')

const reply = (status, body) => new Response(JSON.stringify(body), { status })
const ENV = { STRIPE_SECRET_KEY: 'sk_test_x', SIGNUP_COUPON_ID: 'coupon10' }
const expired = (over = {}) => ({
  id: 'cs_test_abc',
  status: 'expired',
  created: 1790000000,
  amount_total: 7424,
  customer_details: { email: 'Shopper@Example.com' },
  consent: { promotions: 'opt_in' },
  after_expiration: { recovery: { enabled: true, url: 'https://buy.stripe.com/r/live_x', expires_at: 1792600000 } },
  ...over,
})

afterEach(() => {
  vi.unstubAllGlobals()
  sendGmail.mockClear()
})

describe('who gets a recovery email', () => {
  it('requires promotional consent, an email and a recovery link', () => {
    expect(skipReason(expired())).toBeNull()
    expect(skipReason(expired({ consent: { promotions: 'opt_out' } }))).toMatch(/consent/)
    expect(skipReason(expired({ consent: null }))).toMatch(/consent/)
    expect(skipReason(expired({ customer_details: {} }))).toMatch(/email/)
    expect(skipReason(expired({ after_expiration: null }))).toMatch(/recovery/)
  })
  it('never emails the same session twice, or the same address within 30 days', () => {
    const now = Date.parse('2026-10-01T00:00:00Z')
    expect(skipReason(expired(), { now, log: [{ session: 'cs_test_abc', email: 'x@y.z', sentAt: '2025-01-01T00:00:00Z' }] })).toMatch(/this session/)
    expect(skipReason(expired(), { now, log: [{ session: 'cs_other', email: 'shopper@example.com', sentAt: '2026-09-20T00:00:00Z' }] })).toMatch(/30 days/)
    expect(skipReason(expired(), { now, log: [{ session: 'cs_other', email: 'shopper@example.com', sentAt: '2026-08-01T00:00:00Z' }] })).toBeNull()
  })
})

describe('sending', () => {
  const stubStripe = ({ purchased = false } = {}) => {
    const calls = []
    vi.stubGlobal('fetch', async (url, init = {}) => {
      const u = String(url)
      calls.push({ u, form: init.body ? new URLSearchParams(init.body.toString()) : null })
      if (u.includes('/checkout/sessions?')) return reply(200, { data: purchased ? [{ payment_status: 'paid' }] : [] })
      if (u.includes('/line_items')) return reply(200, { data: [{ description: 'Sponge Hydration Tracker - Black', quantity: 1 }] })
      if (u.includes('/promotion_codes')) return reply(200, { code: calls.at(-1).form.get('code') })
      return reply(404, {})
    })
    return calls
  }

  it('creates an expiring single-use code and emails the recovery link', async () => {
    const calls = stubStripe()
    const r = await handleCheckoutExpired(expired(), ENV)
    expect(r.sent).toBe(true)
    expect(r.code).toMatch(/^COMEBACK-[A-HJ-NP-Z2-9]{8}$/)
    const promo = calls.find((c) => c.u.includes('/promotion_codes')).form
    expect(promo.get('coupon')).toBe('coupon10')
    expect(promo.get('max_redemptions')).toBe('1')
    expect(promo.get('metadata[source]')).toBe('cart-recovery')
    expect(Number(promo.get('expires_at'))).toBeGreaterThan(Date.now() / 1000 + 6 * 86400)
    expect(sendGmail).toHaveBeenCalledTimes(1)
    const mail = sendGmail.mock.calls[0][1]
    expect(mail.to).toBe('Shopper@Example.com')
    expect(mail.html).toContain('https://buy.stripe.com/r/live_x')
    expect(mail.html).toContain(r.code)
    expect(mail.html).toContain('Sponge Hydration Tracker - Black')
  })

  it('skips anyone who has since bought', async () => {
    stubStripe({ purchased: true })
    const r = await handleCheckoutExpired(expired(), ENV)
    expect(r.skipped).toMatch(/purchase/)
    expect(sendGmail).not.toHaveBeenCalled()
  })

  it('does nothing without a coupon configured', async () => {
    const r = await handleCheckoutExpired(expired(), { STRIPE_SECRET_KEY: 'sk_test_x' })
    expect(r.skipped).toMatch(/not configured/)
  })

  it('email copy has no em dashes and escapes item names', () => {
    const html = recoveryEmailHtml({ code: 'COMEBACK-AAAA2222', url: 'https://x', items: [{ description: '<b>x</b>', qty: 1 }], days: 7 })
    expect(html).not.toContain('—')
    expect(html).toContain('&lt;b&gt;')
  })
})

describe('checkout session', () => {
  const request = () =>
    new Request('https://www.spongehydration.com/api/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ items: [{ id: 'sponge-clip', qty: 1, colors: ['white'] }] }),
    })

  it('asks Stripe for the offers checkbox and a recovery link with promo codes', async () => {
    const calls = []
    vi.stubGlobal('fetch', async (url, init) => {
      calls.push(new URLSearchParams(init.body.toString()))
      return reply(200, { url: 'https://checkout.stripe.com/c/pay/cs_test_1' })
    })
    const out = await (await createCheckout({ request: request(), env: ENV })).json()
    expect(out.cartRecovery).toBe(true)
    expect(calls[0].get('consent_collection[promotions]')).toBe('auto')
    expect(calls[0].get('after_expiration[recovery][enabled]')).toBe('true')
    expect(calls[0].get('after_expiration[recovery][allow_promotion_codes]')).toBe('true')
    expect(calls[0].get('consent_collection[terms_of_service]')).toBe('required')
  })

  it('drops only the recovery settings if Stripe refuses them, keeping the terms checkbox', async () => {
    const calls = []
    vi.stubGlobal('fetch', async (url, init) => {
      const body = new URLSearchParams(init.body.toString())
      calls.push(body)
      if (body.get('consent_collection[promotions]')) {
        return reply(400, { error: { param: 'consent_collection[promotions]', message: 'Promotional consent is not available.' } })
      }
      return reply(200, { url: 'https://checkout.stripe.com/c/pay/cs_test_2' })
    })
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const out = await (await createCheckout({ request: request(), env: ENV })).json()
    expect(out).toMatchObject({ termsCheckbox: true, cartRecovery: false })
    expect(calls).toHaveLength(2)
    expect(calls[1].get('after_expiration[recovery][enabled]')).toBeNull()
    expect(calls[1].get('consent_collection[terms_of_service]')).toBe('required')
  })
})
