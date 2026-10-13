// GA4 reported more add_to_cart than view_item (6 vs 4, week of 2026-10-05):
// "Order now" in the header, on the homepage and in the shop grid adds a product
// whose page was never opened, and a view that happened before the visitor
// answered the consent banner was dropped for good.
//
// These tests pin the fix: every add_to_cart is preceded by a view_item for the
// same product, and none of it can happen without consent.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setConsent } from '../src/consent.js'

const ITEM = { id: 'sponge-clip', name: 'Sponge', price: 59.99, qty: 2 }
const OTHER = { id: 'sponge-dot', name: 'Sponge Dot', price: 29.99, qty: 1 }

async function loadAnalytics() {
  vi.resetModules()
  vi.stubEnv('VITE_GA4_ID', 'G-TESTGA0001')
  vi.stubEnv('VITE_META_PIXEL_ID', '000000000000001')
  vi.stubEnv('VITE_TIKTOK_PIXEL_ID', 'TESTTIKTOK0001')
  return import('../src/analytics.js')
}

/** GA4 events sent so far, as [name, item_id]. */
function gaEvents() {
  return [...(window.dataLayer || [])]
    .map((x) => Array.from(x))
    .filter((x) => x[0] === 'event' && (x[1] === 'view_item' || x[1] === 'add_to_cart'))
    .map((x) => [x[1], x[2].items[0].item_id])
}
/** Meta events sent so far, as [name, content_id]. */
function metaEvents() {
  return [...(window.fbq?.queue || [])]
    .map((x) => Array.from(x))
    .filter((x) => x[0] === 'track' && (x[1] === 'ViewContent' || x[1] === 'AddToCart'))
    .map((x) => [x[1], x[2].content_ids[0]])
}

beforeEach(() => {
  localStorage.clear()
  document.head.innerHTML = ''
  document.body.innerHTML = ''
  for (const k of ['gtag', 'dataLayer', 'fbq', '_fbq', 'ttq', 'TiktokAnalyticsObject']) delete window[k]
})

afterEach(() => {
  vi.unstubAllEnvs()
  localStorage.clear()
})

describe('add_to_cart is always preceded by view_item', () => {
  it('sends the view first when the product page was never opened', async () => {
    setConsent({ analytics: true, advertising: true })
    const a = await loadAnalytics()
    a.trackAddToCart(ITEM)
    expect(gaEvents()).toEqual([['view_item', 'sponge-clip'], ['add_to_cart', 'sponge-clip']])
    expect(metaEvents()).toEqual([['ViewContent', 'sponge-clip'], ['AddToCart', 'sponge-clip']])
  })

  it('does not repeat a view that was already counted', async () => {
    setConsent({ analytics: true, advertising: true })
    const a = await loadAnalytics()
    a.trackViewItem(ITEM)
    a.trackAddToCart(ITEM)
    a.trackAddToCart(ITEM)
    expect(gaEvents()).toEqual([
      ['view_item', 'sponge-clip'], ['add_to_cart', 'sponge-clip'], ['add_to_cart', 'sponge-clip'],
    ])
  })

  it('tracks each product separately', async () => {
    setConsent({ analytics: true, advertising: false })
    const a = await loadAnalytics()
    a.trackViewItem(ITEM)
    a.trackAddToCart(OTHER)
    expect(gaEvents()).toEqual([
      ['view_item', 'sponge-clip'], ['view_item', 'sponge-dot'], ['add_to_cart', 'sponge-dot'],
    ])
  })

  it('reports the view as one unit even when several are added', async () => {
    setConsent({ analytics: true, advertising: false })
    const a = await loadAnalytics()
    a.trackAddToCart(ITEM)
    const [view, add] = [...window.dataLayer].map((x) => Array.from(x)).filter((x) => x[0] === 'event')
    expect(view[2].items[0].quantity).toBe(1)
    expect(view[2].value).toBe(59.99)
    expect(add[2].items[0].quantity).toBe(2)
    expect(add[2].value).toBe(119.98)
  })
})

describe('a view dropped before consent is counted once consent arrives', () => {
  it('sends nothing before the visitor decides', async () => {
    const a = await loadAnalytics()
    a.trackViewItem(ITEM)
    a.trackAddToCart(ITEM)
    expect(document.querySelectorAll('script[src]')).toHaveLength(0)
    expect(window.dataLayer).toBeUndefined()
    expect(window.fbq).toBeUndefined()
    expect(window.ttq).toBeUndefined()
  })

  it('does not remember the dropped view as counted', async () => {
    const a = await loadAnalytics()
    a.trackViewItem(ITEM) // dropped: no consent yet
    setConsent({ analytics: true, advertising: false })
    a.trackViewItem(ITEM, { onlyMissing: true }) // what the product page does on consent
    a.trackAddToCart(ITEM)
    expect(gaEvents()).toEqual([['view_item', 'sponge-clip'], ['add_to_cart', 'sponge-clip']])
    expect(window.fbq).toBeUndefined()
  })

  it('fills in only the category that was missing', async () => {
    setConsent({ analytics: true, advertising: false })
    const a = await loadAnalytics()
    a.trackViewItem(ITEM)
    setConsent({ analytics: true, advertising: true })
    a.trackViewItem(ITEM, { onlyMissing: true })
    expect(gaEvents()).toEqual([['view_item', 'sponge-clip']])
    expect(metaEvents()).toEqual([['ViewContent', 'sponge-clip']])
  })

  it('never sends the implied view to a category that was declined', async () => {
    setConsent({ analytics: false, advertising: true })
    const a = await loadAnalytics()
    a.trackAddToCart(ITEM)
    expect(window.dataLayer).toBeUndefined()
    expect(metaEvents()).toEqual([['ViewContent', 'sponge-clip'], ['AddToCart', 'sponge-clip']])
  })
})
