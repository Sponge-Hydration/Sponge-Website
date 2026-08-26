// Exercises the REAL appendSubscriber (not a mock) against a stubbed Sheets API.
//
// Why this exists: two test rows were written to the live Subscribers tab during
// verification, and I have no credentials to read that sheet back. This proves
// the de-duplication branch actually works in the shipped code path, which is
// what the sheet inspection would otherwise have demonstrated.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { appendSubscriber } from '../functions/api/_sheets.js'

const ENV = {
  GOOGLE_SA_EMAIL: 'sa@x.iam.gserviceaccount.com',
  GOOGLE_SA_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\nAAAA\n-----END PRIVATE KEY-----',
  GOOGLE_SHEET_ID: 'sheet-1',
}

// Stand in for the JWT signing so the test never needs a real key.
function stubCrypto() {
  vi.spyOn(crypto.subtle, 'importKey').mockResolvedValue({})
  vi.spyOn(crypto.subtle, 'sign').mockResolvedValue(new Uint8Array([1, 2, 3]).buffer)
}

/** @param existingRows rows already in column A of the Subscribers tab */
function stubSheets(existingRows) {
  const calls = []
  const fetchMock = vi.fn(async (url, opts) => {
    const u = String(url)
    calls.push({ url: u, method: opts?.method || 'GET', body: opts?.body })
    if (u.includes('oauth2.googleapis.com/token')) {
      return { ok: true, json: async () => ({ access_token: 'tok' }) }
    }
    if (u.includes('?fields=sheets.properties.title')) {
      return { ok: true, json: async () => ({ sheets: [{ properties: { title: 'Subscribers' } }] }) }
    }
    if (u.includes(':append')) {
      return { ok: true, json: async () => ({}) }
    }
    // The read of existing addresses.
    return { ok: true, json: async () => ({ values: existingRows.map((r) => [r]) }) }
  })
  vi.stubGlobal('fetch', fetchMock)
  return { calls, appended: () => calls.filter((c) => c.url.includes(':append')) }
}

beforeEach(stubCrypto)
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })

describe('de-duplication', () => {
  it('appends an address that is not already on the list', async () => {
    const s = stubSheets(['someone@else.com'])
    const res = await appendSubscriber(ENV, { email: 'new@example.com', source: 'footer' })
    expect(res).toEqual({ added: true })
    expect(s.appended()).toHaveLength(1)
  })

  it('does NOT append an address that is already on the list', async () => {
    const s = stubSheets(['claude-verification-test@spongehydration.com'])
    const res = await appendSubscriber(ENV, {
      email: 'claude-verification-test@spongehydration.com', source: 'footer',
    })
    expect(res).toEqual({ added: false })
    expect(s.appended()).toHaveLength(0)
  })

  it('matches case-insensitively and ignores surrounding whitespace', async () => {
    const s = stubSheets(['  Claude-Verification-Test@SpongeHydration.com '])
    const res = await appendSubscriber(ENV, {
      email: 'claude-verification-test@spongehydration.com', source: 'checkout',
    })
    expect(res).toEqual({ added: false })
    expect(s.appended()).toHaveLength(0)
  })

  it('normalises what it stores, so the list cannot accumulate case variants', async () => {
    const s = stubSheets([])
    await appendSubscriber(ENV, { email: '  MiXeD@Example.COM  ', source: 'footer' })
    const row = JSON.parse(s.appended()[0].body).values[0]
    expect(row[0]).toBe('mixed@example.com')
    expect(row[2]).toBe('footer')
    expect(row[3]).toBe('New')
  })

  it('still appends when the read fails, rather than dropping the signup', async () => {
    // Losing a subscriber is worse than a duplicate row a human can merge.
    vi.spyOn(crypto.subtle, 'importKey').mockResolvedValue({})
    const fetchMock = vi.fn(async (url, opts) => {
      const u = String(url)
      if (u.includes('oauth2.googleapis.com/token')) return { ok: true, json: async () => ({ access_token: 't' }) }
      if (u.includes('?fields=')) return { ok: true, json: async () => ({ sheets: [{ properties: { title: 'Subscribers' } }] }) }
      if (u.includes(':append')) return { ok: true, json: async () => ({}) }
      return { ok: false, text: async () => 'boom' } // the read fails
    })
    vi.stubGlobal('fetch', fetchMock)
    const res = await appendSubscriber(ENV, { email: 'x@y.com', source: 'footer' })
    expect(res).toEqual({ added: true })
  })
})
