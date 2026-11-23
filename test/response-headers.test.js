// Response headers added by functions/_middleware.js (site audit, 2026-11-23):
// security headers on pages, long cache lifetimes on files whose URL never
// changes. Each case below is one way this could go wrong in production.
import { describe, expect, it } from 'vitest'
import { SECURITY_HEADERS, assetCacheControl, onRequest } from '../functions/_middleware.js'

const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1'
const run = (path, { type, status = 200, headers = {} } = {}) =>
  onRequest({
    request: new Request(`https://www.spongehydration.com${path}`, { headers: { 'user-agent': UA } }),
    next: async () =>
      new Response(status === 304 ? null : 'x', {
        status,
        headers: { 'content-type': type, 'cache-control': 'public, max-age=14400, must-revalidate', ...headers },
      }),
  })

describe('security headers', () => {
  it('are on every page', async () => {
    const res = await run('/shop/p/sponge-clip', { type: 'text/html; charset=utf-8' })
    expect(res.headers.get('strict-transport-security')).toBe('max-age=31536000')
    expect(res.headers.get('x-frame-options')).toBe('SAMEORIGIN')
    expect(res.headers.get('content-security-policy')).toBe("frame-ancestors 'self'")
    expect(res.headers.get('permissions-policy')).toBe('camera=(), microphone=(), geolocation=()')
  })

  it('are on the 404 page too', async () => {
    const res = await run('/no-such-page', { type: 'text/html; charset=utf-8', status: 404 })
    expect(res.status).toBe(404)
    for (const name of Object.keys(SECURITY_HEADERS)) expect(res.headers.get(name)).toBeTruthy()
  })

  it('keep the page, its status and its own headers intact', async () => {
    const res = await run('/', { type: 'text/html; charset=utf-8', headers: { 'x-content-type-options': 'nosniff' } })
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('x')
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
    expect(res.headers.get('cache-control')).toBe('public, max-age=14400, must-revalidate')
    // The price-test cookie still rides on the same response.
    expect(res.headers.get('set-cookie')).toMatch(/sponge_ab_price=[AB]/)
  })

  it('never promise HTTPS for subdomains or ask for browser preload', () => {
    expect(SECURITY_HEADERS['Strict-Transport-Security']).not.toMatch(/includeSubDomains|preload/i)
  })

  it('restrict framing only: no script or connect allow-list that could block Stripe or analytics', () => {
    expect(SECURITY_HEADERS['Content-Security-Policy']).not.toMatch(/script-src|connect-src|default-src/)
  })

  it('leave API responses alone', async () => {
    const res = await run('/api/order-status', { type: 'application/json' })
    expect(res.headers.get('strict-transport-security')).toBeNull()
    expect(res.headers.get('cache-control')).toBe('public, max-age=14400, must-revalidate')
    expect(res.headers.get('set-cookie')).toBeNull()
  })
})

describe('cache lifetimes', () => {
  it('keeps content-hashed build files for a year', async () => {
    const res = await run('/assets/app-CNxLtipO.js', { type: 'application/javascript' })
    expect(res.headers.get('cache-control')).toBe('public, max-age=31536000, immutable')
    expect(await res.text()).toBe('x')
    expect(res.headers.get('set-cookie')).toBeNull()
  })

  it('keeps the font for 30 days (its name is not hashed)', async () => {
    const res = await run('/fonts/inter-latin-var.woff2', { type: 'font/woff2' })
    expect(res.headers.get('cache-control')).toBe('public, max-age=2592000')
  })

  it('also applies to a 304 revalidation', async () => {
    const res = await run('/assets/app-CNxLtipO.css', { type: 'text/css', status: 304 })
    expect(res.status).toBe(304)
    expect(res.headers.get('cache-control')).toBe('public, max-age=31536000, immutable')
  })

  it('never long-caches a missing file', async () => {
    const res = await run('/assets/gone-123.js', { type: 'text/html; charset=utf-8', status: 404 })
    expect(res.headers.get('cache-control')).toBe('public, max-age=14400, must-revalidate')
    expect(assetCacheControl('/assets/gone-123.js', 404)).toBeNull()
  })

  it('leaves files with stable names on the default lifetime', async () => {
    for (const p of ['/media/gallery/g1-white-vertical.jpg', '/og-sponge-tracker-2026-10.jpg', '/favicon.svg']) {
      const res = await run(p, { type: 'image/jpeg' })
      expect(res.headers.get('cache-control'), p).toBe('public, max-age=14400, must-revalidate')
    }
  })
})
