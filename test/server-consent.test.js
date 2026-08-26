// Server-side advertising suppression: the browser is long gone by the time the
// Stripe webhook runs, so the buyer's choice travels on the session metadata.
// These tests pin the fail-closed behaviour.

import { describe, expect, it, vi } from 'vitest'
import { adConsentGranted, metaCapiConfigured, sendMetaPurchase } from '../functions/api/_meta-capi.js'

const session = (metadata) => ({ id: 'cs_test_1', metadata })

describe('adConsentGranted', () => {
  it('is true only for an explicit "1"', () => {
    expect(adConsentGranted(session({ ad_consent: '1' }))).toBe(true)
  })

  it('is false for an explicit "0"', () => {
    expect(adConsentGranted(session({ ad_consent: '0' }))).toBe(false)
  })

  it('fails closed when the key is missing', () => {
    expect(adConsentGranted(session({ qty_single: '1' }))).toBe(false)
  })

  it('fails closed when metadata is absent entirely (legacy session)', () => {
    expect(adConsentGranted({ id: 'cs_old' })).toBe(false)
  })

  it('fails closed on a null or undefined session', () => {
    expect(adConsentGranted(null)).toBe(false)
    expect(adConsentGranted(undefined)).toBe(false)
  })

  it('does not accept truthy lookalikes', () => {
    for (const v of ['true', 'yes', 1, true, 'granted', '']) {
      expect(adConsentGranted(session({ ad_consent: v }))).toBe(false)
    }
  })
})

describe('metaCapiConfigured', () => {
  it('needs both the pixel id and the token', () => {
    expect(metaCapiConfigured({ META_PIXEL_ID: '1', META_CAPI_TOKEN: 't' })).toBe(true)
    expect(metaCapiConfigured({ META_PIXEL_ID: '1' })).toBe(false)
    expect(metaCapiConfigured({ META_CAPI_TOKEN: 't' })).toBe(false)
    expect(metaCapiConfigured({})).toBe(false)
  })
})

// Mirrors the gate in webhook.js so a regression there is caught here.
function metaTask(env, sess) {
  if (!adConsentGranted(sess)) return { sent: false, reason: 'declined' }
  if (!metaCapiConfigured(env)) return { sent: false, reason: 'not configured' }
  return { sent: true }
}

describe('webhook gate', () => {
  const env = { META_PIXEL_ID: '123', META_CAPI_TOKEN: 'tok' }

  it('sends when configured and consented', () => {
    expect(metaTask(env, session({ ad_consent: '1' }))).toEqual({ sent: true })
  })

  it('does not send when the buyer declined, even though it is configured', () => {
    expect(metaTask(env, session({ ad_consent: '0' })).sent).toBe(false)
  })

  it('does not send for a session with no consent metadata', () => {
    expect(metaTask(env, session({})).sent).toBe(false)
  })

  it('consent alone is not enough without configuration', () => {
    expect(metaTask({}, session({ ad_consent: '1' })).sent).toBe(false)
  })
})

describe('sendMetaPurchase payload', () => {
  const env = { META_PIXEL_ID: '123', META_CAPI_TOKEN: 'tok', SITE_URL: 'https://www.spongehydration.com' }
  const order = {
    sessionId: 'cs_test_ABC',
    email: '  Nathan@Example.COM ',
    phone: '+1 (714) 555-0100',
    amount: 68.74,
    currency: 'usd',
    shipping: { name: 'Nathan Katzaroff', address: { city: 'San Francisco', state: 'CA', postal_code: '94044-1234', country: 'US' } },
    items: [{ description: 'Sponge Hydration Tracker', qty: 1, amount: 59.99 }],
  }

  it('hashes identifiers and never sends them in the clear', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    vi.stubGlobal('fetch', fetchMock)

    await sendMetaPurchase(env, order, { headers: { get: () => 'test-agent' } })

    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    const ud = body.data[0].user_data
    const raw = JSON.stringify(body)

    // Use full identifiers as needles — a 64-char hex hash will coincidentally
    // contain any short digit run, so a 3-digit fragment is not a valid probe.
    expect(raw).not.toContain('Nathan@Example.COM')
    expect(raw).not.toContain('nathan@example.com')
    expect(raw).not.toContain('7145550100')
    expect(raw).not.toContain('Katzaroff')
    expect(raw).not.toContain('San Francisco')
    expect(raw).not.toContain('94044')
    // SHA-256 hex is 64 chars.
    for (const key of ['em', 'ph', 'fn', 'ln', 'ct', 'st', 'zp', 'country']) {
      expect(ud[key]).toMatch(/^[0-9a-f]{64}$/)
    }
    vi.unstubAllGlobals()
  })

  it('carries the Stripe session id as the dedupe event_id', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    vi.stubGlobal('fetch', fetchMock)
    await sendMetaPurchase(env, order, null)
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.data[0].event_id).toBe('cs_test_ABC')
    expect(body.data[0].event_name).toBe('Purchase')
    expect(body.data[0].custom_data.value).toBe(68.74)
    vi.unstubAllGlobals()
  })

  it('omits client_ip_address, which would be Stripe not the customer', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    vi.stubGlobal('fetch', fetchMock)
    await sendMetaPurchase(env, order, null)
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.data[0].user_data.client_ip_address).toBeUndefined()
    vi.unstubAllGlobals()
  })

  it('refuses to run when not configured', async () => {
    await expect(sendMetaPurchase({}, order, null)).rejects.toThrow(/not configured/)
  })
})
