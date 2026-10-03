// Price A/B test: A = Tracker $64.99 + free shipping, B = Tracker $59.99 + $5
// shipping (whole order). What must hold:
//  - a visitor is assigned once and keeps that arm on return visits;
//  - crawlers always see B (stable search results / structured data);
//  - the page, the cart and Stripe agree on the price for that arm;
//  - every Stripe session records which arm the buyer saw.

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PRICE_TEST, cartShipping, getPriceVariant, priceFor } from '../src/pricing.js'
import { PRICE_TEST as SERVER, priceVariantFor } from '../functions/api/_pricing.js'
import { products } from '../src/data.js'

const tracker = products.find((p) => p.id === 'sponge-clip')
const family = products.find((p) => p.id === 'sponge-family')

// The assignment script exactly as shipped in index.html's <head>.
const html = readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8')
const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).find((s) => s.includes('sponge_ab_price'))
const runHead = () => new Function(script)()
const clearCookie = () => { document.cookie = 'sponge_ab_price=; Max-Age=0; Path=/' }
const setUA = (ua) => Object.defineProperty(navigator, 'userAgent', { value: ua, configurable: true })

beforeEach(() => {
  localStorage.clear()
  clearCookie()
  document.documentElement.removeAttribute('data-price')
  setUA('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Safari/604.1')
})
afterEach(() => vi.restoreAllMocks())

describe('assignment (head script)', () => {
  it('is in index.html and assigns a new visitor to A or B, stored in a cookie and localStorage', () => {
    expect(script).toBeTruthy()
    runHead()
    const v = document.documentElement.getAttribute('data-price')
    expect(['ab-a', 'ab-b']).toContain(v)
    const arm = v === 'ab-a' ? 'A' : 'B'
    expect(document.cookie).toContain(`sponge_ab_price=${arm}`)
    expect(localStorage.getItem('sponge-ab-price')).toBe(arm)
  })

  it('splits roughly 50/50', () => {
    let a = 0
    for (let i = 0; i < 2000; i++) {
      localStorage.clear(); clearCookie(); runHead()
      if (document.documentElement.getAttribute('data-price') === 'ab-a') a++
    }
    expect(a).toBeGreaterThan(850)
    expect(a).toBeLessThan(1150)
  })

  it('keeps a returning visitor in the same arm (cookie)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1) // would pick A for a new visitor
    document.cookie = 'sponge_ab_price=B; Path=/'
    runHead()
    expect(document.documentElement.getAttribute('data-price')).toBe('ab-b')
  })

  it('falls back to localStorage if the cookie was cleared', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9) // would pick B
    localStorage.setItem('sponge-ab-price', 'A')
    runHead()
    expect(document.documentElement.getAttribute('data-price')).toBe('ab-a')
    expect(document.cookie).toContain('sponge_ab_price=A') // cookie restored
  })

  it('always gives crawlers B and stores nothing', () => {
    setUA('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')
    vi.spyOn(Math, 'random').mockReturnValue(0.1)
    runHead()
    expect(document.documentElement.getAttribute('data-price')).toBe('ab-b')
    expect(document.cookie).not.toContain('sponge_ab_price')
  })
})

describe('client pricing', () => {
  it('reads the arm from the page, defaulting to B', () => {
    expect(getPriceVariant()).toBe('B')
    document.documentElement.setAttribute('data-price', 'ab-a')
    expect(getPriceVariant()).toBe('A')
  })

  it('only the Tracker price changes; shipping is free (A) or $5 (B) for the whole order', () => {
    expect(priceFor(tracker, 'A')).toBe(64.99)
    expect(priceFor(tracker, 'B')).toBe(59.99)
    expect(priceFor(family, 'A')).toBe(family.price)
    expect(priceFor(family, 'B')).toBe(family.price)
    const cart = [{ id: 'sponge-family' }, { id: 'sponge-clip' }]
    expect(cartShipping(cart, 'A')).toBe(0)
    expect(cartShipping(cart, 'B')).toBe(5)
    expect(cartShipping([], 'B')).toBe(0)
  })

  it('one Tracker costs the same delivered in both arms ($64.99), so only the framing differs', () => {
    expect(PRICE_TEST.A.trackerPrice + PRICE_TEST.A.shipping).toBeCloseTo(PRICE_TEST.B.trackerPrice + PRICE_TEST.B.shipping, 2)
  })

  it('B matches the catalog price, so prerendered pages and structured data stay correct for crawlers', () => {
    expect(PRICE_TEST.B.trackerPrice).toBe(tracker.price)
  })
})

describe('client and server agree', () => {
  it('mirrors every amount (dollars vs cents)', () => {
    for (const arm of ['A', 'B']) {
      expect(SERVER[arm].trackerAmount).toBe(Math.round(PRICE_TEST[arm].trackerPrice * 100))
      expect(SERVER[arm].shippingAmount).toBe(Math.round(PRICE_TEST[arm].shipping * 100))
    }
  })

  it('takes the arm from the request body, then the cookie, else B', () => {
    const req = (cookie) => new Request('https://x/api', { headers: cookie ? { cookie } : {} })
    expect(priceVariantFor(req(), { priceVariant: 'A' })).toBe('A')
    expect(priceVariantFor(req('foo=1; sponge_ab_price=A'), {})).toBe('A')
    expect(priceVariantFor(req(), { priceVariant: 'Z' })).toBe('B')
    expect(priceVariantFor(req(), {})).toBe('B')
  })
})

describe('Stripe charges the price that arm was shown', () => {
  const create = async (priceVariant, items) => {
    const { onRequestPost } = await import('../functions/api/create-checkout-session.js')
    const forms = []
    vi.stubGlobal('fetch', async (url, init) => {
      forms.push(new URLSearchParams(init.body.toString()))
      return new Response(JSON.stringify({ url: 'https://checkout.stripe.com/c/pay/cs_test_x' }), { status: 200 })
    })
    const request = new Request('https://www.spongehydration.com/api/create-checkout-session', {
      method: 'POST', body: JSON.stringify({ items, priceVariant }),
    })
    const res = await onRequestPost({ request, env: { STRIPE_SECRET_KEY: 'sk_test_dummy' } })
    vi.unstubAllGlobals()
    return { out: await res.json(), form: forms[0] }
  }
  const unit = (form, name) => {
    for (let i = 0; form.has(`line_items[${i}][quantity]`); i++) {
      if (form.get(`line_items[${i}][price_data][product_data][name]`).startsWith(name)) return Number(form.get(`line_items[${i}][price_data][unit_amount]`))
    }
  }

  it('A: Tracker $64.99, free shipping, tagged A', async () => {
    const { out, form } = await create('A', [{ id: 'sponge-clip', qty: 1, colors: ['black'] }, { id: 'sponge-family', qty: 1 }])
    expect(out.priceVariant).toBe('A')
    expect(unit(form, 'Sponge Hydration Tracker')).toBe(6499)
    expect(unit(form, 'Sponge Family Pack')).toBe(19999) // unchanged
    expect(form.get('shipping_options[0][shipping_rate_data][fixed_amount][amount]')).toBe('0')
    expect(form.get('metadata[price_variant]')).toBe('A')
  })

  it('B: Tracker $59.99, flat $5 shipping, tagged B', async () => {
    const { out, form } = await create('B', [{ id: 'sponge-clip', qty: 2, colors: ['white'] }])
    expect(out.priceVariant).toBe('B')
    expect(unit(form, 'Sponge Hydration Tracker')).toBe(5999)
    expect(form.get('shipping_options[0][shipping_rate_data][fixed_amount][amount]')).toBe('500')
    expect(form.get('metadata[price_variant]')).toBe('B')
  })
})
