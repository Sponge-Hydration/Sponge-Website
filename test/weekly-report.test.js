// Weekly website report bundle: date windows, GA4 flattening, Stripe order
// math, Clarity roll-ups, and the handler's auth + per-section failure isolation.

import { afterEach, describe, expect, it, vi } from 'vitest'
import { reportWindows, ptMidnight, ptDate } from '../functions/api/_report-dates.js'
import { splitByRange, summarizeOrders, summarizeApp, onRequest } from '../functions/api/weekly-site-report.js'
import { aggregateSnapshots, trimSnapshot, normalizeUrl, latestPerDay } from '../functions/api/_clarity.js'
import { onRequest as snapshot } from '../functions/api/clarity-snapshot.js'

afterEach(() => vi.unstubAllGlobals())

describe('report windows (Pacific time)', () => {
  it('covers 7 PT days ending the given day, and the 7 before', () => {
    const w = reportWindows(new Date('2026-09-28T02:46:00Z'), '2026-09-27')
    expect(w.thisWeek.start).toBe('2026-09-21')
    expect(w.thisWeek.days).toHaveLength(7)
    expect(w.lastWeek).toMatchObject({ start: '2026-09-14', end: '2026-09-20' })
    // PDT is UTC-7, so midnight PT = 07:00Z
    expect(new Date(w.thisWeek.startMs).toISOString()).toBe('2026-09-21T07:00:00.000Z')
    expect(new Date(w.thisWeek.endMs).toISOString()).toBe('2026-09-28T07:00:00.000Z')
  })
  it('handles the DST change (PST is UTC-8)', () => {
    expect(new Date(ptMidnight('2026-11-02')).toISOString()).toBe('2026-11-02T08:00:00.000Z')
  })
  it('a Sunday-evening PT run is still Sunday in PT', () => {
    expect(ptDate(new Date('2026-09-28T02:46:00Z'))).toBe('2026-09-27')
  })
})

describe('GA4 date-range flattening', () => {
  const resp = {
    dimensionHeaders: [{ name: 'deviceCategory' }, { name: 'dateRange' }],
    metricHeaders: [{ name: 'sessions' }, { name: 'engagementRate' }],
    rows: [
      { dimensionValues: [{ value: 'mobile' }, { value: 'thisWeek' }], metricValues: [{ value: '40' }, { value: '0.51234' }] },
      { dimensionValues: [{ value: 'mobile' }, { value: 'lastWeek' }], metricValues: [{ value: '30' }, { value: '0.4' }] },
    ],
  }
  it('splits rows by range and rounds metrics', () => {
    const out = splitByRange(resp)
    expect(out.thisWeek).toEqual([{ deviceCategory: 'mobile', sessions: 40, engagementRate: 0.512 }])
    expect(out.lastWeek[0].sessions).toBe(30)
  })
  it('returns zeros for an empty overview', () => {
    const out = splitByRange({ metricHeaders: [{ name: 'sessions' }], rows: [] }, false)
    expect(out).toEqual({ thisWeek: { sessions: 0 }, lastWeek: { sessions: 0 } })
  })
})

describe('Stripe order summary', () => {
  it('counts only paid sessions, sums money in dollars and units by SKU, nets refunds', () => {
    const s = summarizeOrders(
      [
        { payment_status: 'paid', amount_total: 7424, amount_subtotal: 5999, total_details: { amount_shipping: 875, amount_tax: 550 }, metadata: { qty_single: '1', qty_dot: '0' }, customer_details: { email: 'A@x.com' } },
        { payment_status: 'paid', amount_total: 3874, amount_subtotal: 2999, total_details: { amount_shipping: 875 }, metadata: { qty_dot: '1' }, customer_details: { email: 'a@x.com' } },
        { payment_status: 'unpaid', amount_total: 9999, metadata: { qty_single: '5' } },
      ],
      [{ status: 'succeeded', amount: 3874 }, { status: 'failed', amount: 100 }]
    )
    expect(s).toMatchObject({
      orders: 2, uniqueCustomers: 1, grossRevenue: 112.98, shipping: 17.5, tax: 5.5,
      refunds: { count: 1, amount: 38.74 }, netRevenue: 74.24, avgOrderValue: 56.49,
      unitsBySku: { single: 1, dot: 1 }, unpaidOrExpiredCheckouts: 1,
    })
  })
})

describe('Clarity roll-up', () => {
  const day = (rage, sessions, url) => [
    { metricName: 'RageClickCount', information: [{ URL: url, sessionsCount: String(sessions), subTotal: String(rage), sessionsWithMetricPercentage: 10 }] },
  ]
  it('sums counts, session-weights percentages, and merges URLs that differ only by query string', () => {
    const agg = aggregateSnapshots(
      [day(2, 10, 'https://www.spongehydration.com/shop/p/sponge-clip?utm_source=ig'), day(4, 30, 'https://www.spongehydration.com/shop/p/sponge-clip')],
      'URL'
    )
    expect(agg.RageClickCount).toEqual([
      { URL: '/shop/p/sponge-clip', sessionsCount: 40, subTotal: 6, sessionsWithMetricPercentage: 10, daysWithData: 2 },
    ])
  })
  it('matches the dimension field case-insensitively (Clarity sends "Url")', () => {
    const agg = aggregateSnapshots([[{ metricName: 'Traffic', information: [{ Url: 'https://www.spongehydration.com/how-it-works?x=1', totalSessionCount: '3' }] }]], 'URL')
    expect(agg.Traffic[0]).toMatchObject({ URL: '/how-it-works', totalSessionCount: 3 })
  })
  it('normalizes the home page to "/"', () => {
    expect(normalizeUrl('https://www.spongehydration.com/?fbclid=1')).toBe('/')
  })
  it('trims a snapshot to fit one sheet cell', () => {
    const big = [{ metricName: 'Traffic', information: Array.from({ length: 500 }, (_, i) => ({ URL: `/p${i}`.padEnd(300, 'x'), sessionsCount: i })) }]
    const t = trimSnapshot(big)
    expect(JSON.stringify(t).length).toBeLessThan(49000)
    expect(t[0].information[0].sessionsCount).toBe(499)
  })
  it('keeps the latest snapshot per day and dimension', () => {
    const rows = latestPerDay([
      { date: '2026-09-21', dimension: 'URL', takenAt: '2026-09-22T06:00:00Z', data: [1] },
      { date: '2026-09-21', dimension: 'URL', takenAt: '2026-09-22T07:00:00Z', data: [2] },
      { date: '2026-09-21', dimension: 'Device', takenAt: '2026-09-22T06:00:00Z', data: [3] },
    ])
    expect(rows.map((r) => r.data[0]).sort()).toEqual([2, 3])
  })
})

describe('app summary', () => {
  it('ignores test/epoch accounts and counts weekly actives', () => {
    const w = reportWindows(new Date(), '2026-09-27')
    const s = summarizeApp(
      {
        a: { name: 'Ann', first_active: '2026-09-22', daily_measurements: { '2026-09-22': 5, '2026-09-23': 2 } },
        b: { name: 'Bob', first_active: '2026-08-01', daily_measurements: { '2026-09-15': 1 } },
        t: { name: 'test user', first_active: '2026-09-22', daily_measurements: { '2026-09-22': 9 } },
        z: { name: 'Zed', first_active: '1970-01-01', daily_measurements: {} },
      },
      w
    )
    expect(s.totalUsers).toBe(2)
    expect(s.thisWeek).toEqual({ newUsers: 1, weeklyActiveUsers: 1, totalMeasurements: 7, activeDaysPerActiveUser: 2 })
    expect(s.lastWeek.weeklyActiveUsers).toBe(1)
  })
})

describe('endpoints', () => {
  const req = (path) => new Request(`https://www.spongehydration.com${path}`)
  it('reject a wrong key', async () => {
    const env = { GA4_REPORT_TOKEN: 'k' }
    expect((await onRequest({ request: req('/api/weekly-site-report?key=nope'), env })).status).toBe(401)
    expect((await snapshot({ request: req('/api/clarity-snapshot?key=nope'), env })).status).toBe(401)
  })
  it('still returns the other sections when one source fails', async () => {
    vi.stubGlobal('fetch', async (url) => {
      const u = String(url)
      if (u.includes('api.stripe.com')) return new Response(JSON.stringify({ data: [], has_more: false }))
      if (u.includes('execute-api')) return new Response('{}')
      return new Response('boom', { status: 500 })
    })
    const env = { GA4_REPORT_TOKEN: 'k', STRIPE_SECRET_KEY: 'sk_test_x' }
    const res = await onRequest({ request: req('/api/weekly-site-report?key=k&end=2026-09-27'), env })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.periods.thisWeek).toMatchObject({ start: '2026-09-21', end: '2026-09-27' })
    expect(body.stripe.thisWeek.orders).toBe(0)
    expect(body.ga4.error).toMatch(/service account/)
    expect(body.app.totalUsers).toBe(0)
    expect(body.clarity.live3dError).toMatch(/CLARITY_API_TOKEN/)
  })
  it('returns a single section on request, and rejects unknown ones', async () => {
    vi.stubGlobal('fetch', async () => new Response(JSON.stringify({ data: [], has_more: false })))
    const env = { GA4_REPORT_TOKEN: 'k', STRIPE_SECRET_KEY: 'sk_test_x' }
    const body = await (await onRequest({ request: req('/api/weekly-site-report?key=k&section=stripe'), env })).json()
    expect(Object.keys(body)).toEqual(['ok', 'generatedAt', 'timezone', 'periods', 'stripe'])
    expect((await onRequest({ request: req('/api/weekly-site-report?key=k&section=nope'), env })).status).toBe(400)
  })
})
