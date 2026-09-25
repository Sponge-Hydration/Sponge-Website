// Signup "mystery gift": each NEW subscriber gets a unique, single-use 10% code.
// What must hold:
//  - codes are created as Stripe promotion codes with max_redemptions=1 (Stripe
//    enforces the single use), on the shared signup coupon;
//  - Stripe Checkout shows the promotion-code field so the code can be entered;
//  - only brand-new subscribers get one (no farming by re-signing up);
//  - a Stripe/Gmail failure never breaks the signup itself;
//  - receipts show the discount so the totals add up;
//  - the customer-facing copy has no em dashes.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { randomCode, createGiftCode, giftConfigured } from '../functions/api/_gift.js'

vi.mock('../functions/api/_sheets.js', () => ({
  sheetsConfigured: () => true,
  appendSubscriber: vi.fn(async () => ({ added: true })),
}))
vi.mock('../functions/api/_integrations.js', async (orig) => {
  const real = await orig()
  return { ...real, gmailConfigured: () => true, sendGmail: vi.fn(async () => ({})) }
})

const { appendSubscriber } = await import('../functions/api/_sheets.js')
const { sendGmail, giftEmailHtml } = await import('../functions/api/_integrations.js')
const { onRequestPost: subscribe } = await import('../functions/api/subscribe.js')

const ENV = { STRIPE_SECRET_KEY: 'sk_test_dummy', SIGNUP_COUPON_ID: 'coupon_signup10' }
const reply = (status, body) => new Response(JSON.stringify(body), { status })
const signup = (env = ENV, body = { email: 'new@example.com', source: 'homepage' }) =>
  subscribe({ request: { json: async () => body }, env })

let stripeCalls
beforeEach(() => {
  stripeCalls = []
  appendSubscriber.mockClear()
  appendSubscriber.mockImplementation(async () => ({ added: true }))
  sendGmail.mockClear()
  vi.stubGlobal('fetch', async (url, init) => {
    stripeCalls.push({ url, headers: init.headers, form: new URLSearchParams(init.body.toString()) })
    return reply(200, { code: stripeCalls.at(-1).form.get('code') })
  })
})
afterEach(() => vi.unstubAllGlobals())

describe('gift codes', () => {
  it('look like GIFT-XXXXXXXX with no 0/O/1/I lookalikes', () => {
    for (let i = 0; i < 200; i++) expect(randomCode()).toMatch(/^GIFT-[A-HJ-NP-Z2-9]{8}$/)
  })

  it('are unique across many draws', () => {
    const seen = new Set(Array.from({ length: 5000 }, () => randomCode()))
    expect(seen.size).toBe(5000)
  })

  it('are single use: created with max_redemptions=1 on the signup coupon', async () => {
    const code = await createGiftCode(ENV, { email: 'a@b.com' })
    expect(stripeCalls).toHaveLength(1)
    const { url, headers, form } = stripeCalls[0]
    expect(url).toBe('https://api.stripe.com/v1/promotion_codes')
    expect(form.get('max_redemptions')).toBe('1')
    expect(form.get('coupon')).toBe('coupon_signup10')
    expect(form.get('code')).toBe(code)
    expect(form.get('metadata[email]')).toBe('a@b.com')
    // Pinned so an account-level API upgrade can't change the request shape.
    expect(headers['Stripe-Version']).toBe('2024-06-20')
  })

  it('retries once on a code collision, then gives up on real errors', async () => {
    let n = 0
    vi.stubGlobal('fetch', async (url, init) => {
      n++
      if (n === 1) return reply(400, { error: { message: 'A promotion code with this code already exists.' } })
      return reply(200, { code: new URLSearchParams(init.body.toString()).get('code') })
    })
    await expect(createGiftCode(ENV)).resolves.toMatch(/^GIFT-/)
    expect(n).toBe(2)

    n = 0
    vi.stubGlobal('fetch', async () => { n++; return reply(400, { error: { message: 'No such coupon' } }) })
    await expect(createGiftCode(ENV)).rejects.toThrow(/No such coupon/)
    expect(n).toBe(1) // a non-collision error is not retried
  })

  it('are off entirely until the coupon id is configured', () => {
    expect(giftConfigured({ STRIPE_SECRET_KEY: 'sk' })).toBe(false)
    expect(giftConfigured(ENV)).toBe(true)
  })
})

describe('signup issues the gift', () => {
  it('to a new subscriber: creates one code and emails it to them', async () => {
    const res = await signup()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(stripeCalls).toHaveLength(1)
    expect(sendGmail).toHaveBeenCalledOnce()
    const mail = sendGmail.mock.calls[0][1]
    expect(mail.to).toBe('new@example.com')
    expect(mail.html).toContain(stripeCalls[0].form.get('code'))
  })

  it('never to an existing subscriber, so codes cannot be farmed', async () => {
    appendSubscriber.mockImplementation(async () => ({ added: false }))
    const res = await signup()
    expect(await res.json()).toEqual({ ok: true }) // same reply: no list-membership leak
    expect(stripeCalls).toHaveLength(0)
    expect(sendGmail).not.toHaveBeenCalled()
  })

  it('never to a bot tripping the honeypot', async () => {
    await signup(ENV, { email: 'bot@x.com', website: 'http://spam' })
    expect(stripeCalls).toHaveLength(0)
  })

  it('not at all when the coupon is not configured, and signup still works', async () => {
    const res = await signup({ STRIPE_SECRET_KEY: 'sk_test_dummy' })
    expect(res.status).toBe(200)
    expect(stripeCalls).toHaveLength(0)
  })

  it('a Stripe failure is logged, never turned into a failed signup', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubGlobal('fetch', async () => reply(500, { error: { message: 'stripe down' } }))
    const res = await signup()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(sendGmail).not.toHaveBeenCalled()
  })

  it('runs after the response via waitUntil when the runtime provides it', async () => {
    const pending = []
    const ctx = { request: { json: async () => ({ email: 'w@x.com' }) }, env: ENV, waitUntil: (p) => pending.push(p) }
    const res = await subscribe(ctx)
    expect(res.status).toBe(200)
    expect(pending).toHaveLength(1)
    await pending[0]
    expect(sendGmail).toHaveBeenCalledOnce()
  })
})

describe('checkout accepts the code', () => {
  it('shows the promotion-code field on Stripe Checkout', async () => {
    const { onRequestPost: createSession } = await import('../functions/api/create-checkout-session.js')
    const forms = []
    vi.stubGlobal('fetch', async (url, init) => {
      forms.push(new URLSearchParams(init.body.toString()))
      return reply(200, { url: 'https://checkout.stripe.com/c/pay/cs_test_x' })
    })
    const request = new Request('https://www.spongehydration.com/api/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ items: [{ id: 'sponge-clip', qty: 1, colors: ['black'] }] }),
    })
    const res = await createSession({ request, env: { STRIPE_SECRET_KEY: 'sk_test_dummy' } })
    expect(res.status).toBe(200)
    expect(forms[0].get('allow_promotion_codes')).toBe('true')
    // Stripe rejects allow_promotion_codes combined with pre-applied discounts.
    expect([...forms[0].keys()].some((k) => k.startsWith('discounts'))).toBe(false)
  })
})

describe('emails', () => {
  it('the gift email reveals the code, says single use, and has no em dash', () => {
    const html = giftEmailHtml({ code: 'GIFT-ABCD2345' })
    expect(html).toContain('GIFT-ABCD2345')
    expect(html).toMatch(/10% off/)
    expect(html).toMatch(/works once/)
    expect(html).not.toContain('—')
  })

  it('receipts show the discount so items - discount + shipping + tax = total', async () => {
    const { customerEmailHtml } = await import('../functions/api/_integrations.js')
    const html = customerEmailHtml({
      orderNumber: '#1', currency: 'usd', amount: 62.74, discount: 6.0, shippingCost: 8.75, tax: 0,
      items: [{ description: 'Sponge Hydration Tracker - Black', qty: 1, amount: 59.99 }],
    })
    expect(html).toContain('Discount')
    expect(html).toContain('-$6.00')
    expect(59.99 - 6.0 + 8.75 + 0).toBeCloseTo(62.74, 2)
  })

  it('receipts without a code show no discount row', async () => {
    const { customerEmailHtml } = await import('../functions/api/_integrations.js')
    const html = customerEmailHtml({ orderNumber: '#2', currency: 'usd', amount: 68.74, shippingCost: 8.75, items: [] })
    expect(html).not.toContain('Discount')
  })
})
