// Every expired Stripe checkout is logged to the "Abandoned Carts" tab: one row
// per session (webhook retries must not duplicate), the tab is created on first
// use, and the row reflects the cart, opt-in, recovery outcome and team flag.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../functions/api/_google-sa.js', () => ({
  serviceAccountConfigured: () => true,
  getGoogleAccessToken: async () => 'tok',
}))
const { abandonedRow, itemsSummary, recoveryLabel, logAbandonedCart, ABANDONED_HEADERS } = await import('../functions/api/_abandoned.js')

const ENV = { GOOGLE_SHEET_ID: 'sheet1' }
const session = (over = {}) => ({
  id: 'cs_live_abc',
  created: 1790000000,
  expires_at: 1790086400,
  amount_total: 17630,
  consent: { promotions: 'opt_in' },
  customer_details: { email: 'shopper@example.com' },
  metadata: { qty_single: '2', qty_adhesive_3pack: '1', qty_family: '0', qty_dot: '0', clips_black: '1', clips_white: '1', internal: '0' },
  ...over,
})
const reply = (status, body) => new Response(JSON.stringify(body), { status })

describe('row contents', () => {
  it('summarises the cart from checkout metadata', () => {
    expect(itemsSummary(session().metadata)).toBe('Sponge Tracker x2, Adhesive 3-Pack x1 (clips: black 1, white 1)')
    expect(itemsSummary({})).toBe('unknown')
  })

  it('records value, opt-in, email, recovery outcome and team flag', () => {
    const row = abandonedRow(session(), { skipped: 'no promotional consent' })
    expect(row).toHaveLength(ABANDONED_HEADERS.length)
    expect(row[2]).toBe('cs_live_abc')
    expect(row[3]).toBe('shopper@example.com')
    expect(row[4]).toBe('yes')
    expect(row[6]).toBe('176.30')
    expect(row[7]).toBe('Not sent: no promotional consent')
    expect(row[8]).toBe('')
    const team = abandonedRow(session({ metadata: { internal: '1' }, consent: null, customer_details: null }), {})
    expect(team[3]).toBe('')
    expect(team[4]).toBe('no')
    expect(team[8]).toBe('yes')
  })

  it('labels recovery outcomes', () => {
    expect(recoveryLabel({ sent: true })).toBe('Sent')
    expect(recoveryLabel({ error: 'boom' })).toBe('Error: boom')
    expect(recoveryLabel(undefined)).toBe('')
  })
})

describe('logging', () => {
  let calls
  const stub = (existing) => vi.stubGlobal('fetch', async (url, init = {}) => {
    calls.push({ url, method: init.method || 'GET', body: init.body ? JSON.parse(init.body) : null })
    if (url.includes('/values/') && !url.includes(':append')) return existing
    return reply(200, {})
  })
  beforeEach(() => { calls = [] })
  afterEach(() => vi.unstubAllGlobals())

  it('creates the tab with headers on first use, then appends the row', async () => {
    stub(reply(400, { error: 'Unable to parse range' }))
    expect(await logAbandonedCart(session(), ENV, { skipped: 'x' })).toEqual({ logged: true })
    expect(calls.some((c) => c.url.includes(':batchUpdate') && c.body.requests[0].addSheet)).toBe(true)
    const appends = calls.filter((c) => c.url.includes(':append'))
    expect(appends[0].body.values[0]).toEqual(ABANDONED_HEADERS)
    expect(appends[1].body.values[0][2]).toBe('cs_live_abc')
  })

  it('does not duplicate a session Stripe retries', async () => {
    stub(reply(200, { values: [['cs_other'], ['cs_live_abc']] }))
    expect(await logAbandonedCart(session(), ENV, {})).toEqual({ skipped: 'already logged' })
    expect(calls.some((c) => c.url.includes(':append'))).toBe(false)
  })

  it('appends a new session to an existing tab', async () => {
    stub(reply(200, { values: [['cs_other']] }))
    expect(await logAbandonedCart(session(), ENV, {})).toEqual({ logged: true })
    expect(calls.filter((c) => c.url.includes(':append'))).toHaveLength(1)
  })

  it('is a no-op when the sheet is not configured', async () => {
    stub(reply(200, {}))
    expect(await logAbandonedCart(session(), {}, {})).toEqual({ skipped: 'sheet not configured' })
    expect(calls).toHaveLength(0)
  })
})
