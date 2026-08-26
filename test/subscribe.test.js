// Email capture (A-03). The endpoint reuses the Google service account the
// order sheet already relies on, so signup needs no new credentials.

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { onRequestPost } from '../functions/api/subscribe.js'

const req = (body) => ({ json: async () => body })
const ENV = { GOOGLE_SA_EMAIL: 'sa@x.iam', GOOGLE_SA_PRIVATE_KEY: 'k', GOOGLE_SHEET_ID: 'sheet1' }

// _sheets.js is mocked so these tests exercise the endpoint's own logic —
// validation, honeypot, source handling, failure reporting — without needing a
// real service account or network.
vi.mock('../functions/api/_sheets.js', () => ({
  sheetsConfigured: (env) => Boolean(env.GOOGLE_SA_EMAIL && env.GOOGLE_SA_PRIVATE_KEY && env.GOOGLE_SHEET_ID),
  appendSubscriber: vi.fn(async () => ({ added: true })),
}))
const { appendSubscriber } = await import('../functions/api/_sheets.js')

beforeEach(() => { appendSubscriber.mockClear() })

const body = async (res) => JSON.parse(await res.text())

describe('validation', () => {
  it('accepts a valid address', async () => {
    const res = await onRequestPost({ request: req({ email: 'a@b.com', source: 'footer' }), env: ENV })
    expect(res.status).toBe(200)
    expect(await body(res)).toEqual({ ok: true })
    expect(appendSubscriber).toHaveBeenCalledOnce()
  })

  it('rejects a malformed address without writing', async () => {
    for (const email of ['', 'nope', 'a@b', 'a b@c.com', '@b.com']) {
      const res = await onRequestPost({ request: req({ email }), env: ENV })
      expect(res.status).toBe(400)
    }
    expect(appendSubscriber).not.toHaveBeenCalled()
  })

  it('rejects a body that is not JSON', async () => {
    const res = await onRequestPost({ request: { json: async () => { throw new Error('bad') } }, env: ENV })
    expect(res.status).toBe(400)
  })
})

describe('spam handling', () => {
  it('silently discards a honeypot submission but reports success', async () => {
    const res = await onRequestPost({ request: req({ email: 'a@b.com', website: 'http://spam' }), env: ENV })
    expect(res.status).toBe(200)
    expect(await body(res)).toEqual({ ok: true })
    expect(appendSubscriber).not.toHaveBeenCalled()
  })
})

describe('source handling', () => {
  it('records a known source', async () => {
    await onRequestPost({ request: req({ email: 'a@b.com', source: 'checkout' }), env: ENV })
    expect(appendSubscriber.mock.calls[0][1].source).toBe('checkout')
  })

  it('falls back to "site" for anything unrecognised', async () => {
    await onRequestPost({ request: req({ email: 'a@b.com', source: '<script>' }), env: ENV })
    expect(appendSubscriber.mock.calls[0][1].source).toBe('site')
  })
})

describe('failure is reported honestly', () => {
  it('503s when sheets are not configured rather than faking success', async () => {
    const res = await onRequestPost({ request: req({ email: 'a@b.com' }), env: {} })
    expect(res.status).toBe(503)
    expect((await body(res)).error).toMatch(/not configured/i)
  })

  it('500s when the write throws, so the UI can say so', async () => {
    appendSubscriber.mockRejectedValueOnce(new Error('sheets down'))
    const res = await onRequestPost({ request: req({ email: 'a@b.com' }), env: ENV })
    expect(res.status).toBe(500)
    expect((await body(res)).error).toBeTruthy()
  })
})

describe('list membership is not disclosed', () => {
  it('returns the same response for a new and an existing address', async () => {
    appendSubscriber.mockResolvedValueOnce({ added: true })
    const fresh = await onRequestPost({ request: req({ email: 'new@b.com' }), env: ENV })
    appendSubscriber.mockResolvedValueOnce({ added: false })
    const dupe = await onRequestPost({ request: req({ email: 'old@b.com' }), env: ENV })
    expect(fresh.status).toBe(dupe.status)
    expect(await body(fresh)).toEqual(await body(dupe))
  })
})
