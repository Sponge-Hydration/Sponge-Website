// ?internal=1 marks a team browser: GA4, Clarity and the ad pixels must never
// load there, even with full consent. ?internal=0 undoes it.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setConsent } from '../src/consent.js'
import { INTERNAL_KEY, isInternal } from '../src/internal.js'

async function loadAnalytics() {
  vi.resetModules()
  vi.stubEnv('VITE_GA4_ID', 'G-TESTGA0001')
  vi.stubEnv('VITE_CLARITY_ID', 'testclarity')
  vi.stubEnv('VITE_META_PIXEL_ID', '000000000000001')
  vi.stubEnv('VITE_TIKTOK_PIXEL_ID', 'TESTTIKTOK0001')
  return import('../src/analytics.js')
}
const srcs = () => [...document.querySelectorAll('script[src]')].map((s) => s.src)
const anyTracker = () => srcs().some((s) => /googletagmanager|clarity\.ms|facebook|tiktok/.test(s))
const visit = (qs) => window.history.replaceState({}, '', `/${qs}`)

beforeEach(() => {
  localStorage.clear()
  document.head.innerHTML = ''
  for (const k of ['gtag', 'dataLayer', 'clarity', 'fbq', '_fbq', 'ttq']) delete window[k]
  vi.spyOn(console, 'info').mockImplementation(() => {})
  visit('')
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('internal traffic switch', () => {
  it('?internal=1 sets the flag, and it persists without the param', () => {
    visit('?internal=1')
    expect(isInternal()).toBe(true)
    expect(localStorage.getItem(INTERNAL_KEY)).toBe('1')
    visit('')
    expect(isInternal()).toBe(true)
  })

  it('?internal=0 clears it', () => {
    localStorage.setItem(INTERNAL_KEY, '1')
    visit('?internal=0')
    expect(isInternal()).toBe(false)
    expect(localStorage.getItem(INTERNAL_KEY)).toBeNull()
  })

  it('ignores other values', () => {
    visit('?internal=yes')
    expect(isInternal()).toBe(false)
  })

  it('loads and fires nothing for an internal browser, even with full consent', async () => {
    setConsent({ analytics: true, advertising: true })
    visit('?internal=1')
    const a = await loadAnalytics()
    a.initAnalytics()
    a.trackPageView('/')
    a.trackViewItem({ id: 'sponge-clip', name: 'Sponge', price: 59.99 })
    a.trackAddToCart({ id: 'sponge-clip', name: 'Sponge', price: 59.99 })
    a.trackPurchase({ sessionId: 'cs_test_1', value: 59.99 })
    expect(anyTracker()).toBe(false)
    expect(window.gtag).toBeUndefined()
    expect(window.clarity).toBeUndefined()
  })

  it('a normal visitor with consent still gets GA4 and Clarity', async () => {
    setConsent({ analytics: true, advertising: false })
    const a = await loadAnalytics()
    a.initAnalytics()
    expect(srcs().some((s) => s.includes('googletagmanager.com'))).toBe(true)
    expect(srcs().some((s) => s.includes('clarity.ms'))).toBe(true)
  })
})
