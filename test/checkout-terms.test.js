// Stripe's required Terms of Service checkbox. The failure that matters: if the
// terms URL ever goes missing from the Stripe Dashboard, Stripe rejects every
// session that asks for the checkbox. Checkout must then fall back to working
// without it rather than taking the store down. Any other Stripe error must not
// trigger the retry.

import { afterEach, describe, expect, it, vi } from 'vitest'
import { onRequestPost } from '../functions/api/create-checkout-session.js'
import { isTermsSetupError, termsCheckboxParams } from '../functions/api/_checkout-terms.js'

const ORIGIN = 'https://www.spongehydration.com'
const request = () =>
  new Request(`${ORIGIN}/api/create-checkout-session`, {
    method: 'POST',
    body: JSON.stringify({ items: [{ id: 'sponge-clip', qty: 1, colors: ['white'] }] }),
  })
const env = { STRIPE_SECRET_KEY: 'sk_test_dummy' }
const reply = (status, body) => new Response(JSON.stringify(body), { status })

afterEach(() => vi.restoreAllMocks())

describe('the terms checkbox on the Stripe session', () => {
  it('is required, and its text links the Terms and names arbitration', async () => {
    const calls = []
    vi.stubGlobal('fetch', async (url, init) => {
      calls.push(new URLSearchParams(init.body.toString()))
      return reply(200, { url: 'https://checkout.stripe.com/c/pay/cs_test_x' })
    })
    const res = await onRequestPost({ request: request(), env })
    const out = await res.json()
    expect(res.status).toBe(200)
    expect(out.termsCheckbox).toBe(true)
    expect(calls).toHaveLength(1)
    expect(calls[0].get('consent_collection[terms_of_service]')).toBe('required')
    const msg = calls[0].get('custom_text[terms_of_service_acceptance][message]')
    expect(msg).toContain(`${ORIGIN}/legal/terms`)
    expect(msg).toContain(`${ORIGIN}/legal/privacy`)
    expect(msg).toMatch(/arbitration/)
    expect(msg.length).toBeLessThanOrEqual(1200) // Stripe's custom_text limit
  })

  it('falls back to a session without the checkbox if Stripe says the terms URL is missing', async () => {
    const calls = []
    vi.stubGlobal('fetch', async (url, init) => {
      const body = new URLSearchParams(init.body.toString())
      calls.push(body)
      if (body.get('consent_collection[terms_of_service]')) {
        return reply(400, { error: { type: 'invalid_request_error', param: 'consent_collection[terms_of_service]', message: 'You must set a terms of service URL in your public business details.' } })
      }
      return reply(200, { url: 'https://checkout.stripe.com/c/pay/cs_test_y' })
    })
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const res = await onRequestPost({ request: request(), env })
    const out = await res.json()
    expect(res.status).toBe(200)
    expect(out.url).toContain('cs_test_y')
    expect(out.termsCheckbox).toBe(false)
    expect(calls).toHaveLength(2)
    expect(calls[1].get('consent_collection[terms_of_service]')).toBeNull()
    // The retry is otherwise the same order: same line item and price.
    expect(calls[1].get('line_items[0][price_data][unit_amount]')).toBe(calls[0].get('line_items[0][price_data][unit_amount]'))
    expect(console.warn).toHaveBeenCalled()
  })

  it('does not retry on an unrelated Stripe error', async () => {
    let n = 0
    vi.stubGlobal('fetch', async () => {
      n++
      return reply(400, { error: { type: 'invalid_request_error', param: 'line_items[0][price_data][unit_amount]', message: 'Invalid integer' } })
    })
    const res = await onRequestPost({ request: request(), env })
    expect(res.status).toBe(502)
    expect(n).toBe(1)
  })
})

describe('isTermsSetupError', () => {
  it('recognises terms and consent errors only', () => {
    expect(isTermsSetupError(400, { param: 'consent_collection[terms_of_service]' })).toBe(true)
    expect(isTermsSetupError(400, { message: 'Please set your Terms of Service URL' })).toBe(true)
    expect(isTermsSetupError(400, { param: 'custom_text[terms_of_service_acceptance][message]' })).toBe(true)
    expect(isTermsSetupError(400, { param: 'shipping_options', message: 'Invalid' })).toBe(false)
    expect(isTermsSetupError(500, { param: 'consent_collection[terms_of_service]' })).toBe(false)
    expect(isTermsSetupError(400, null)).toBe(false)
  })

  it('builds absolute links from the request origin', () => {
    const p = termsCheckboxParams('https://example.test')
    expect(p['custom_text[terms_of_service_acceptance][message]']).toContain('](https://example.test/legal/terms)')
  })
})
