// Per-video tracked links and the "How did you hear about us?" dropdown.

import { afterEach, describe, expect, it, vi } from 'vitest'
import { parseLinks, destinationUrl, isBot, summarizeClicks, normalizeSlug } from '../functions/api/_video-links.js'
import { summarizeOrders } from '../functions/api/weekly-site-report.js'
import { onRequestPost as createCheckout } from '../functions/api/create-checkout-session.js'
import { onRequestGet as videoRedirect } from '../functions/v/[slug].js'

afterEach(() => vi.unstubAllGlobals())
const reply = (status, body) => new Response(JSON.stringify(body), { status })

describe('video links', () => {
  const links = parseLinks([
    ['TT-Widget', 'TikTok', 'https://tiktok.com/v/1', 'Widget demo', '2026-09-24', '/shop/p/sponge-clip'],
    ['yt-unbox', 'youtube', '', 'Unboxing', '2026-09-20', ''],
    ['bad', 'instagram', '', '', '', 'https://evil.example/phish'],
  ])
  it('normalizes slugs and keeps the platform', () => {
    expect(Object.keys(links)).toEqual(['tt-widget', 'yt-unbox', 'bad'])
    expect(links['tt-widget'].platform).toBe('tiktok')
    expect(normalizeSlug(' TT Widget! ')).toBe('ttwidget')
  })
  it('redirects only to our own site, with UTM tags', () => {
    const u = new URL(destinationUrl(links['tt-widget'], 'tt-widget'))
    expect(u.origin + u.pathname).toBe('https://www.spongehydration.com/shop/p/sponge-clip')
    expect(Object.fromEntries(u.searchParams)).toEqual({ utm_source: 'tiktok', utm_medium: 'social', utm_content: 'tt-widget' })
    expect(new URL(destinationUrl(links.bad, 'bad')).hostname).toBe('www.spongehydration.com')
    expect(new URL(destinationUrl(links['yt-unbox'], 'yt-unbox')).pathname).toBe('/')
  })
  it('recognises link-preview bots', () => {
    expect(isBot('facebookexternalhit/1.1')).toBe(true)
    expect(isBot('Mozilla/5.0 (iPhone) AppleWebKit musical_ly_35.0 BytedanceWebview')).toBe(false)
  })
  it('counts human clicks per link and platform inside the window', () => {
    const s = summarizeClicks(
      [
        { at: '2026-09-22T10:00:00Z', slug: 'tt-widget', country: 'US', bot: false },
        { at: '2026-09-22T11:00:00Z', slug: 'tt-widget', country: 'US', bot: false },
        { at: '2026-09-22T11:00:00Z', slug: 'tt-widget', bot: true },
        { at: '2026-09-23T11:00:00Z', slug: 'yt-unbox', country: 'CA', bot: false },
        { at: '2026-08-01T00:00:00Z', slug: 'yt-unbox', bot: false },
      ],
      links, Date.parse('2026-09-21T07:00:00Z'), Date.parse('2026-09-28T07:00:00Z')
    )
    expect(s).toMatchObject({ totalClicks: 3, botClicksExcluded: 1, byPlatform: { tiktok: 2, youtube: 1 } })
    expect(s.links[0]).toMatchObject({ slug: 'tt-widget', clicks: 2, title: 'Widget demo', countries: { US: 2 } })
  })
  it('still redirects when the sheet is not configured', async () => {
    const res = await videoRedirect({ request: new Request('https://www.spongehydration.com/v/abc'), env: {}, params: { slug: 'abc' } })
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toContain('utm_content=abc')
  })
})

describe('how did you hear about us', () => {
  const request = () =>
    new Request('https://www.spongehydration.com/api/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ items: [{ id: 'sponge-clip', qty: 1, colors: ['white'] }] }),
    })
  it('adds an optional dropdown to checkout', async () => {
    const calls = []
    vi.stubGlobal('fetch', async (url, init) => {
      calls.push(new URLSearchParams(init.body.toString()))
      return reply(200, { url: 'https://checkout.stripe.com/c/pay/cs_1' })
    })
    const out = await (await createCheckout({ request: request(), env: { STRIPE_SECRET_KEY: 'sk_test_x' } })).json()
    expect(out.heardAbout).toBe(true)
    expect(calls[0].get('custom_fields[0][type]')).toBe('dropdown')
    expect(calls[0].get('custom_fields[0][optional]')).toBe('true')
    expect(calls[0].get('custom_fields[0][dropdown][options][0][value]')).toBe('tiktok')
  })
  it('drops just the dropdown if Stripe refuses it', async () => {
    const calls = []
    vi.stubGlobal('fetch', async (url, init) => {
      const b = new URLSearchParams(init.body.toString())
      calls.push(b)
      if (b.get('custom_fields[0][key]')) return reply(400, { error: { param: 'custom_fields[0][dropdown]', message: 'bad' } })
      return reply(200, { url: 'https://checkout.stripe.com/c/pay/cs_2' })
    })
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const out = await (await createCheckout({ request: request(), env: { STRIPE_SECRET_KEY: 'sk_test_x' } })).json()
    expect(out).toMatchObject({ heardAbout: false, termsCheckbox: true, cartRecovery: true })
    expect(calls).toHaveLength(2)
  })
  it('tallies answers on paid orders', () => {
    const s = summarizeOrders(
      [
        { payment_status: 'paid', amount_total: 100, custom_fields: [{ key: 'heardabout', dropdown: { value: 'tiktok' } }] },
        { payment_status: 'paid', amount_total: 100, custom_fields: [{ key: 'heardabout', dropdown: { value: null } }] },
      ],
      []
    )
    expect(s.heardAbout).toEqual({ tiktok: 1, 'not answered': 1 })
  })
})
