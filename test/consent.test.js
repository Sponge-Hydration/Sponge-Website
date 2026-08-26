import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  CONSENT_EVENT,
  STORAGE_KEY,
  clearTrackingCookies,
  getConsent,
  gpcEnabled,
  revokeConsent,
  setConsent,
} from '../src/consent.js'

function setGpc(value) {
  Object.defineProperty(navigator, 'globalPrivacyControl', {
    value,
    configurable: true,
    writable: true,
  })
}

beforeEach(() => {
  localStorage.clear()
  setGpc(undefined)
})

afterEach(() => {
  localStorage.clear()
  setGpc(undefined)
})

describe('default state', () => {
  it('denies everything before a decision is made', () => {
    const c = getConsent()
    expect(c.decided).toBe(false)
    expect(c.analytics).toBe(false)
    expect(c.advertising).toBe(false)
  })

  it('writes nothing to storage just by being read', () => {
    getConsent()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})

describe('persistence', () => {
  it('remembers an accept-all decision', () => {
    setConsent({ analytics: true, advertising: true })
    const c = getConsent()
    expect(c).toMatchObject({ analytics: true, advertising: true, decided: true })
  })

  it('remembers a partial decision', () => {
    setConsent({ analytics: true, advertising: false })
    expect(getConsent()).toMatchObject({ analytics: true, advertising: false, decided: true })
  })

  it('records a decline as an explicit decision, not as undecided', () => {
    setConsent({ analytics: false, advertising: false })
    const c = getConsent()
    expect(c.decided).toBe(true)
    expect(c.analytics).toBe(false)
    expect(c.advertising).toBe(false)
  })

  it('survives a simulated page reload', () => {
    setConsent({ analytics: true, advertising: false })
    // getConsent re-reads localStorage every call, so this is the reload path.
    expect(getConsent().analytics).toBe(true)
  })

  it('ignores a stored payload from a different schema version', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 99, analytics: true, advertising: true }))
    expect(getConsent().decided).toBe(false)
  })

  it('ignores corrupt stored JSON rather than throwing', () => {
    localStorage.setItem(STORAGE_KEY, 'not json{')
    expect(() => getConsent()).not.toThrow()
    expect(getConsent().decided).toBe(false)
  })
})

describe('revocation', () => {
  it('returns to the undecided state so the banner reappears', () => {
    setConsent({ analytics: true, advertising: true })
    expect(getConsent().decided).toBe(true)
    revokeConsent()
    const c = getConsent()
    expect(c.decided).toBe(false)
    expect(c.analytics).toBe(false)
    expect(c.advertising).toBe(false)
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('lets a visitor downgrade from accept-all to decline-all', () => {
    setConsent({ analytics: true, advertising: true })
    setConsent({ analytics: false, advertising: false })
    expect(getConsent()).toMatchObject({ analytics: false, advertising: false, decided: true })
  })
})

describe('Global Privacy Control', () => {
  it('is detected from navigator', () => {
    setGpc(true)
    expect(gpcEnabled()).toBe(true)
  })

  it('forces advertising off even with no stored decision', () => {
    setGpc(true)
    expect(getConsent().advertising).toBe(false)
    expect(getConsent().gpc).toBe(true)
  })

  it('overrides a previously stored advertising grant', () => {
    setConsent({ analytics: true, advertising: true })
    setGpc(true)
    const c = getConsent()
    expect(c.advertising).toBe(false)
    expect(c.analytics).toBe(true) // GPC targets sharing, not analytics
  })

  it('refuses to persist an advertising grant while asserted', () => {
    setGpc(true)
    setConsent({ analytics: true, advertising: true })
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
    expect(stored.advertising).toBe(false)
  })

  it('restores the stored choice if the signal goes away', () => {
    setConsent({ analytics: false, advertising: true })
    setGpc(true)
    expect(getConsent().advertising).toBe(false)
    setGpc(undefined)
    expect(getConsent().advertising).toBe(true)
  })
})

describe('change notification', () => {
  it('emits an event so listeners can react to a new choice', () => {
    let fired = 0
    const handler = () => { fired += 1 }
    window.addEventListener(CONSENT_EVENT, handler)
    setConsent({ analytics: true, advertising: false })
    revokeConsent()
    window.removeEventListener(CONSENT_EVENT, handler)
    expect(fired).toBe(2)
  })
})

describe('cookie clearing', () => {
  it('removes known tracker cookies and leaves others alone', () => {
    document.cookie = '_ga=GA1.1.123'
    document.cookie = '_fbp=fb.1.456'
    document.cookie = 'sponge_keepme=yes'
    clearTrackingCookies()
    expect(document.cookie).not.toContain('_ga=')
    expect(document.cookie).not.toContain('_fbp=')
    expect(document.cookie).toContain('sponge_keepme=yes')
  })
})
