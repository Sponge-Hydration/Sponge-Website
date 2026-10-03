// The price-arm cookie is set by the SERVER (functions/_middleware.js) so Safari
// keeps it a year (it caps script-written cookies at 7 days), with the page
// script as a careful second layer. What must hold:
//  - new visitor: server assigns + marks it new; returning: server re-issues the
//    same arm; email link ?pv= wins; crawlers and non-HTML get nothing;
//  - the page script prefers the arm remembered in localStorage over a brand-new
//    server assignment (cookies cleared, site data kept);
//  - the page script never rewrites a cookie that already matches (in Safari
//    that would swap the one-year server cookie for a 7-day one).

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { onRequest, priceArmCookies } from '../functions/_middleware.js'

const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Safari/604.1'
const req = (url, { cookie, ua = UA, method = 'GET' } = {}) =>
  new Request(url, { method, headers: { 'user-agent': ua, ...(cookie ? { cookie } : {}) } })
const arms = (cookies) => cookies.map((c) => c.split(';')[0])

describe('server-set arm cookie (middleware)', () => {
  const U = 'https://www.spongehydration.com/'
  it('assigns a new visitor 50/50 for a year, Secure, plus a short-lived "new" marker', () => {
    const a = priceArmCookies(req(U), new URL(U), () => 0.1)
    expect(arms(a)).toEqual(['sponge_ab_price=A', 'sponge_ab_new=1'])
    expect(a[0]).toMatch(/Max-Age=31536000/)
    expect(a[0]).toMatch(/Secure/)
    expect(a[0]).toMatch(/SameSite=Lax/)
    expect(a[0]).not.toMatch(/HttpOnly/) // the page script must be able to read it
    expect(arms(priceArmCookies(req(U), new URL(U), () => 0.9))[0]).toBe('sponge_ab_price=B')
  })

  it("re-issues a returning visitor's arm unchanged (no marker)", () => {
    const a = priceArmCookies(req(U, { cookie: 'x=1; sponge_ab_price=B' }), new URL(U), () => 0.1)
    expect(arms(a)).toEqual(['sponge_ab_price=B'])
  })

  it('an email link (?pv=) sets that arm, even over a different existing one', () => {
    const url = 'https://www.spongehydration.com/products?gift=GIFT-ABCD2345&pv=A'
    expect(arms(priceArmCookies(req(url, { cookie: 'sponge_ab_price=B' }), new URL(url)))).toEqual(['sponge_ab_price=A'])
  })

  it('ignores garbage values', () => {
    const url = 'https://www.spongehydration.com/?pv=Z'
    expect(arms(priceArmCookies(req(url, { cookie: 'sponge_ab_price=Q' }), new URL(url), () => 0.9))[0]).toBe('sponge_ab_price=B')
  })

  it('sets nothing for crawlers or non-GET requests', () => {
    expect(priceArmCookies(req(U, { ua: 'Googlebot/2.1' }), new URL(U))).toEqual([])
    expect(priceArmCookies(req(U, { method: 'POST' }), new URL(U))).toEqual([])
  })

  it('adds the cookie to page responses only, never to assets; apex still redirects', async () => {
    const run = (url, type) => onRequest({ request: req(url), next: async () => new Response('x', { headers: { 'content-type': type } }) })
    const page = await run(U, 'text/html; charset=utf-8')
    expect(page.headers.get('set-cookie')).toMatch(/sponge_ab_price=[AB]/)
    const asset = await run('https://www.spongehydration.com/assets/app.js', 'application/javascript')
    expect(asset.headers.get('set-cookie')).toBeNull()
    const apex = await run('https://spongehydration.com/products', 'text/html')
    expect(apex.status).toBe(301)
    expect(apex.headers.get('location')).toBe('https://www.spongehydration.com/products')
  })
})

describe('page script with a server-set cookie', () => {
  const html = readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8')
  const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).find((s) => s.includes('sponge_ab_price'))
  const run = () => new Function(script)()
  let writes
  const realDesc = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie')

  beforeEach(() => {
    localStorage.clear()
    document.cookie = 'sponge_ab_price=; Max-Age=0; Path=/'
    document.cookie = 'sponge_ab_new=; Max-Age=0; Path=/'
    document.documentElement.removeAttribute('data-price')
    Object.defineProperty(navigator, 'userAgent', { value: UA, configurable: true })
    writes = []
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () => realDesc.get.call(document),
      set: (v) => { writes.push(v); realDesc.set.call(document, v) },
    })
  })
  afterEach(() => { delete document.cookie; vi.restoreAllMocks() })

  it('never rewrites a cookie that already matches (keeps the server one-year cookie)', () => {
    realDesc.set.call(document, 'sponge_ab_price=A; Path=/')
    localStorage.setItem('sponge-ab-price', 'A')
    run()
    expect(document.documentElement.getAttribute('data-price')).toBe('ab-a')
    expect(writes.filter((w) => w.startsWith('sponge_ab_price='))).toEqual([])
  })

  it('keeps the remembered arm when the server just assigned a different new one', () => {
    realDesc.set.call(document, 'sponge_ab_price=B; Path=/')
    realDesc.set.call(document, 'sponge_ab_new=1; Path=/')
    localStorage.setItem('sponge-ab-price', 'A')
    run()
    expect(document.documentElement.getAttribute('data-price')).toBe('ab-a')
    expect(document.cookie).toContain('sponge_ab_price=A')
    expect(document.cookie).not.toContain('sponge_ab_new=1') // marker consumed
  })

  it('a truly new visitor takes the server assignment', () => {
    realDesc.set.call(document, 'sponge_ab_price=B; Path=/')
    realDesc.set.call(document, 'sponge_ab_new=1; Path=/')
    run()
    expect(document.documentElement.getAttribute('data-price')).toBe('ab-b')
    expect(localStorage.getItem('sponge-ab-price')).toBe('B')
  })

  it('an email-link arm (server cookie, no marker) wins over a different remembered arm', () => {
    realDesc.set.call(document, 'sponge_ab_price=A; Path=/')
    localStorage.setItem('sponge-ab-price', 'B')
    run()
    expect(document.documentElement.getAttribute('data-price')).toBe('ab-a')
    expect(localStorage.getItem('sponge-ab-price')).toBe('A')
  })
})

describe('gift email link', () => {
  it("carries the subscriber's arm", async () => {
    const { giftEmailHtml } = await import('../functions/api/_integrations.js')
    expect(giftEmailHtml({ code: 'GIFT-ABCD2345', priceVariant: 'A' })).toContain('/products?gift=GIFT-ABCD2345&pv=A')
    expect(giftEmailHtml({ code: 'GIFT-ABCD2345' })).toContain('/products?gift=GIFT-ABCD2345"')
  })
})
