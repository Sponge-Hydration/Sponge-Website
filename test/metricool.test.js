// Metricool is an `analytics`-category tag: never before consent, never for
// advertising-only consent, never on ?internal=1 team browsers; SPA navigations
// are counted once its script has loaded.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setConsent } from '../src/consent.js'

const HASH = 'ad5b04a2cf01975fc9c354037d5086a'
const loadAnalytics = async () => { vi.resetModules(); vi.stubEnv('VITE_METRICOOL_HASH', HASH); return import('../src/analytics.js') }
const metricoolScript = () => [...document.querySelectorAll('script[src]')].find((s) => s.src.includes('tracker.metricool.com'))

beforeEach(() => {
  localStorage.clear()
  document.head.innerHTML = ''
  delete window.beTracker
  vi.spyOn(console, 'info').mockImplementation(() => {})
  window.history.replaceState({}, '', '/')
})
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks() })

describe('Metricool', () => {
  it('does not load before the visitor decides', async () => {
    const a = await loadAnalytics()
    a.initAnalytics()
    expect(metricoolScript()).toBeUndefined()
  })

  it('does not load with advertising-only consent', async () => {
    setConsent({ analytics: false, advertising: true })
    const a = await loadAnalytics()
    a.initAnalytics()
    expect(metricoolScript()).toBeUndefined()
  })

  it('does not load on an internal team browser, even with consent', async () => {
    setConsent({ analytics: true, advertising: true })
    window.history.replaceState({}, '', '/?internal=1')
    const a = await loadAnalytics()
    a.initAnalytics()
    expect(metricoolScript()).toBeUndefined()
  })

  it('loads with analytics consent, counts the landing page once, then each SPA navigation', async () => {
    setConsent({ analytics: true, advertising: false })
    const a = await loadAnalytics()
    a.trackPageView('/') // before the script loads: not counted here
    const s = metricoolScript()
    expect(s).toBeDefined()
    const t = vi.fn()
    window.beTracker = { t }
    s.onload() // script finished loading: landing page counted
    expect(t).toHaveBeenCalledTimes(1)
    expect(t).toHaveBeenCalledWith({ hash: HASH })
    a.trackPageView('/products')
    expect(t).toHaveBeenCalledTimes(2)
    a.initAnalytics()
    expect(document.querySelectorAll('script[src*="tracker.metricool.com"]')).toHaveLength(1)
  })

  it('is inert when VITE_METRICOOL_HASH is not set', async () => {
    setConsent({ analytics: true, advertising: false })
    vi.resetModules()
    const a = await import('../src/analytics.js')
    a.initAnalytics()
    expect(metricoolScript()).toBeUndefined()
  })
})
