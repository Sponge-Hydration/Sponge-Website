// Proves the tags cannot load or fire against the visitor's choice.
//
// analytics.js reads its pixel IDs from import.meta.env at module load, so each
// scenario stubs those and re-imports the module with a fresh registry. The
// assertion that matters is the injected <script> list: if no script for a
// vendor is in the document, no network request to that vendor can happen.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setConsent } from '../src/consent.js'

const GA = 'G-TESTGA0001'
const META = '000000000000001'
const TIKTOK = 'TESTTIKTOK0001'

function setGpc(value) {
  Object.defineProperty(navigator, 'globalPrivacyControl', {
    value, configurable: true, writable: true,
  })
}

/** Fresh analytics module with the three IDs configured. */
async function loadAnalytics() {
  vi.resetModules()
  vi.stubEnv('VITE_GA4_ID', GA)
  vi.stubEnv('VITE_META_PIXEL_ID', META)
  vi.stubEnv('VITE_TIKTOK_PIXEL_ID', TIKTOK)
  return import('../src/analytics.js')
}

function injectedSrcs() {
  return [...document.querySelectorAll('script[src]')].map((s) => s.src)
}
const hasGa = () => injectedSrcs().some((s) => s.includes('googletagmanager.com'))
const hasMeta = () => injectedSrcs().some((s) => s.includes('connect.facebook.net'))
const hasTiktok = () => injectedSrcs().some((s) => s.includes('analytics.tiktok.com'))

beforeEach(() => {
  localStorage.clear()
  setGpc(undefined)
  document.head.innerHTML = ''
  document.body.innerHTML = ''
  delete window.gtag
  delete window.dataLayer
  delete window.fbq
  delete window._fbq
  delete window.ttq
  delete window.TiktokAnalyticsObject
})

afterEach(() => {
  vi.unstubAllEnvs()
  localStorage.clear()
  setGpc(undefined)
})

describe('before any decision (cold first visit)', () => {
  it('loads no vendor script at all', async () => {
    const a = await loadAnalytics()
    a.initAnalytics()
    expect(hasGa()).toBe(false)
    expect(hasMeta()).toBe(false)
    expect(hasTiktok()).toBe(false)
  })

  it('drops every funnel event silently', async () => {
    const a = await loadAnalytics()
    a.trackPageView('/')
    a.trackViewItem({ id: 'sponge-clip', name: 'Sponge', price: 59.99, qty: 1 })
    a.trackAddToCart({ id: 'sponge-clip', name: 'Sponge', price: 59.99, qty: 1 })
    a.trackBeginCheckout([{ id: 'sponge-clip', name: 'Sponge', price: 59.99, qty: 1 }], 68.74)
    a.trackPurchase({ sessionId: 'cs_test_1', value: 68.74 })
    expect(injectedSrcs()).toHaveLength(0)
    expect(window.dataLayer).toBeUndefined()
    expect(window.fbq).toBeUndefined()
    expect(window.ttq).toBeUndefined()
  })
})

describe('declined everything', () => {
  it('loads no vendor script', async () => {
    setConsent({ analytics: false, advertising: false })
    const a = await loadAnalytics()
    a.initAnalytics()
    a.trackPageView('/')
    a.trackPurchase({ sessionId: 'cs_test_2', value: 68.74 })
    expect(hasGa()).toBe(false)
    expect(hasMeta()).toBe(false)
    expect(hasTiktok()).toBe(false)
  })
})

describe('analytics only', () => {
  it('loads GA4 but neither ad vendor', async () => {
    setConsent({ analytics: true, advertising: false })
    const a = await loadAnalytics()
    a.initAnalytics()
    expect(hasGa()).toBe(true)
    expect(hasMeta()).toBe(false)
    expect(hasTiktok()).toBe(false)
  })

  it('sends GA events but no ad events', async () => {
    setConsent({ analytics: true, advertising: false })
    const a = await loadAnalytics()
    a.trackPurchase({ sessionId: 'cs_test_3', value: 131.33 })
    const events = [...window.dataLayer].map((x) => Array.from(x)).filter((x) => x[0] === 'event')
    expect(events.some((e) => e[1] === 'purchase')).toBe(true)
    expect(window.fbq).toBeUndefined()
    expect(window.ttq).toBeUndefined()
  })
})

describe('advertising only', () => {
  it('loads Meta and TikTok but not GA4', async () => {
    setConsent({ analytics: false, advertising: true })
    const a = await loadAnalytics()
    a.initAnalytics()
    expect(hasGa()).toBe(false)
    expect(hasMeta()).toBe(true)
    expect(hasTiktok()).toBe(true)
    expect(window.dataLayer).toBeUndefined()
  })
})

describe('accepted everything', () => {
  it('loads all three', async () => {
    setConsent({ analytics: true, advertising: true })
    const a = await loadAnalytics()
    a.initAnalytics()
    expect(hasGa()).toBe(true)
    expect(hasMeta()).toBe(true)
    expect(hasTiktok()).toBe(true)
  })

  it('fires the full funnel', async () => {
    setConsent({ analytics: true, advertising: true })
    const a = await loadAnalytics()
    a.trackViewItem({ id: 'sponge-clip', name: 'Sponge', price: 59.99, qty: 1 })
    a.trackAddToCart({ id: 'sponge-clip', name: 'Sponge', price: 59.99, qty: 1 })
    a.trackBeginCheckout([{ id: 'sponge-clip', name: 'Sponge', price: 59.99, qty: 1 }], 68.74)
    a.trackPurchase({ sessionId: 'cs_test_4', value: 68.74 })
    const names = [...window.dataLayer].map((x) => Array.from(x)).filter((x) => x[0] === 'event').map((x) => x[1])
    expect(names).toEqual(
      expect.arrayContaining(['view_item', 'add_to_cart', 'begin_checkout', 'purchase'])
    )
  })
})

describe('GPC overrides a stored advertising grant', () => {
  it('loads GA4 but refuses the ad vendors', async () => {
    setConsent({ analytics: true, advertising: true })
    setGpc(true)
    const a = await loadAnalytics()
    a.initAnalytics()
    a.trackPurchase({ sessionId: 'cs_test_5', value: 68.74 })
    expect(hasGa()).toBe(true)
    expect(hasMeta()).toBe(false)
    expect(hasTiktok()).toBe(false)
  })
})

describe('cold page load (child effect before parent init)', () => {
  it('still tracks, because every entry point initialises first', async () => {
    setConsent({ analytics: true, advertising: false })
    const a = await loadAnalytics()
    // Simulates a page component's effect running before Layout's initAnalytics.
    a.trackViewItem({ id: 'sponge-clip', name: 'Sponge', price: 59.99, qty: 1 })
    expect(hasGa()).toBe(true)
    const names = [...window.dataLayer].map((x) => Array.from(x)).filter((x) => x[0] === 'event').map((x) => x[1])
    expect(names).toContain('view_item')
  })
})

describe('mid-session consent change', () => {
  it('stops firing ad events as soon as consent is withdrawn', async () => {
    setConsent({ analytics: true, advertising: true })
    const a = await loadAnalytics()
    a.initAnalytics()
    expect(hasMeta()).toBe(true)
    const fbqCalls = []
    window.fbq = (...args) => fbqCalls.push(args)

    setConsent({ analytics: true, advertising: false })
    a.trackPurchase({ sessionId: 'cs_test_6', value: 68.74 })
    expect(fbqCalls).toHaveLength(0)
  })
})

describe('no IDs configured', () => {
  it('is inert even with full consent', async () => {
    setConsent({ analytics: true, advertising: true })
    vi.resetModules()
    vi.stubEnv('VITE_GA4_ID', '')
    vi.stubEnv('VITE_META_PIXEL_ID', '')
    vi.stubEnv('VITE_TIKTOK_PIXEL_ID', '')
    const a = await import('../src/analytics.js')
    a.initAnalytics()
    a.trackPurchase({ sessionId: 'cs_test_7', value: 68.74 })
    expect(injectedSrcs()).toHaveLength(0)
    expect(a.analyticsConfigured).toBe(false)
  })
})
