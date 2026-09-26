// Weekly website data bundle for the Sunday team report.
//
// Returns JSON only (it never sends email). A claude.ai scheduled task GETs it,
// writes the analysis + suggestions, and emails team@spongehydration.com.
// Each section is fetched independently: if one source fails, its section
// carries { error } and the rest still come back.
//
// Sections (this week = 7 PT days ending today, lastWeek = the 7 before):
//   traffic   Cloudflare Web Analytics: cookieless, so it counts every visit,
//             not just visitors who accepted the analytics banner
//   ga4       overview, channels, sources, landing pages, devices, geo,
//             new vs returning, e-commerce funnel   (GA4 Data API, web only)
//   stripe    paid Checkout orders, revenue, shipping, tax, units by SKU, refunds
//   clarity   daily snapshots from clarity-snapshot.js rolled up per week,
//             plus a live last-3-days pull as a fallback
//   signups   email-list signups from the Subscribers tab (counts only)
//   app       app users / new signups / weekly actives from the retention API
//
// Env: GA4_REPORT_TOKEN (trigger key), GOOGLE_SA_EMAIL / GOOGLE_SA_PRIVATE_KEY,
//      GOOGLE_SHEET_ID, STRIPE_SECRET_KEY, CLARITY_API_TOKEN (optional),
//      GA4_PROPERTY_ID (optional, default 437571529),
//      CF_ANALYTICS_TOKEN (Account Analytics: Read), CF_ACCOUNT_ID and
//      CF_WA_SITE_TAG (optional; default to the Sponge account / site)
//
// Trigger:  GET /api/weekly-site-report?key=<GA4_REPORT_TOKEN>
//           optional &end=YYYY-MM-DD to report the week ending that PT date,
//           &live=0 to skip the live Clarity call (saves API quota)
//           &section=traffic|ga4|stripe|clarity|signups|app to return one section only

import { getGoogleAccessToken, serviceAccountConfigured } from './_google-sa.js'
import { aggregateSnapshots, fetchClarity, loadSnapshots, FRICTION_METRICS } from './_clarity.js'
import { reportWindows, ptDate } from './_report-dates.js'

const DEFAULT_PROPERTY = '437571529'
const GA_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly'
const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly'
const FUNNEL = ['session_start', 'view_item', 'add_to_cart', 'begin_checkout', 'purchase']
const RETENTION_API = 'https://ajtwnkl2yb.execute-api.us-east-2.amazonaws.com/test/sponge?Type=getUserRetention'

export async function onRequest({ request, env }) {
  const url = new URL(request.url)
  const provided = url.searchParams.get('key') || request.headers.get('x-report-token')
  if (!env.GA4_REPORT_TOKEN) return json({ error: 'GA4_REPORT_TOKEN not configured' }, 500)
  if (provided !== env.GA4_REPORT_TOKEN) return json({ error: 'unauthorized' }, 401)

  const end = url.searchParams.get('end')
  if (end && !/^\d{4}-\d{2}-\d{2}$/.test(end)) return json({ error: 'end must be YYYY-MM-DD' }, 400)
  const win = reportWindows(new Date(), end || ptDate())
  const live = url.searchParams.get('live') !== '0'

  // ?section=ga4 (etc.) returns just that section. Scheduled runs fetch the
  // sections one at a time so each response stays small enough to read whole.
  const sections = {
    traffic: () => trafficSection(env, win),
    ga4: () => ga4Section(env, win),
    stripe: () => stripeSection(env, win),
    clarity: () => claritySection(env, win, live),
    signups: () => signupSection(env, win),
    app: () => appSection(win),
  }
  const only = url.searchParams.get('section')
  if (only && !sections[only]) {
    return json({ error: `section must be one of: ${Object.keys(sections).join(', ')}` }, 400)
  }
  const names = only ? [only] : Object.keys(sections)
  const settle = (p) => p.catch((e) => ({ error: String(e?.message || e) }))
  const results = await Promise.all(names.map((n) => settle(sections[n]())))

  return json({
    ok: true,
    generatedAt: new Date().toISOString(),
    timezone: 'America/Los_Angeles',
    periods: {
      thisWeek: { start: win.thisWeek.start, end: win.thisWeek.end, note: 'end day is partial if it is today' },
      lastWeek: { start: win.lastWeek.start, end: win.lastWeek.end },
    },
    ...Object.fromEntries(names.map((n, i) => [n, results[i]])),
  })
}

// --- Cloudflare Web Analytics (cookieless, consent-free traffic counts) ------

const CF_ACCOUNT = '11011d90c39d9b8cfe4f46afe2b01267'
const CF_SITE_TAG = '06ad41267e1046f58ff8d2585ab572f6' // spongehydration.com

const CF_QUERY = `query($a: string!, $s: string!, $st: Time!, $en: Time!) {
  viewer { accounts(filter: { accountTag: $a }) {
    total: rumPageloadEventsAdaptiveGroups(limit: 1, filter: { siteTag: $s, datetime_geq: $st, datetime_lt: $en, bot: 0 }) { count sum { visits } }
    pages: rumPageloadEventsAdaptiveGroups(limit: 10, filter: { siteTag: $s, datetime_geq: $st, datetime_lt: $en, bot: 0 }, orderBy: [sum_visits_DESC]) { count sum { visits } dimensions { requestPath } }
    referrers: rumPageloadEventsAdaptiveGroups(limit: 10, filter: { siteTag: $s, datetime_geq: $st, datetime_lt: $en, bot: 0 }, orderBy: [sum_visits_DESC]) { count sum { visits } dimensions { refererHost } }
    devices: rumPageloadEventsAdaptiveGroups(limit: 5, filter: { siteTag: $s, datetime_geq: $st, datetime_lt: $en, bot: 0 }, orderBy: [sum_visits_DESC]) { count sum { visits } dimensions { deviceType } }
    countries: rumPageloadEventsAdaptiveGroups(limit: 8, filter: { siteTag: $s, datetime_geq: $st, datetime_lt: $en, bot: 0 }, orderBy: [sum_visits_DESC]) { count sum { visits } dimensions { countryName } }
  } }
}`

export function shapeCfWeek(acct) {
  const rows = (list, dim) =>
    (list || []).map((r) => ({ [dim]: r.dimensions?.[dim] || '(direct/none)', visits: r.sum?.visits || 0, pageViews: r.count || 0 }))
  const t = acct?.total?.[0]
  return {
    visits: t?.sum?.visits || 0,
    pageViews: t?.count || 0,
    topPages: rows(acct?.pages, 'requestPath'),
    referrers: rows(acct?.referrers, 'refererHost'),
    devices: rows(acct?.devices, 'deviceType'),
    countries: rows(acct?.countries, 'countryName'),
  }
}

async function trafficSection(env, win) {
  if (!env.CF_ANALYTICS_TOKEN) throw new Error('CF_ANALYTICS_TOKEN not configured')
  const week = async (w) => {
    const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.CF_ANALYTICS_TOKEN}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        query: CF_QUERY,
        variables: {
          a: env.CF_ACCOUNT_ID || CF_ACCOUNT,
          s: env.CF_WA_SITE_TAG || CF_SITE_TAG,
          st: new Date(w.startMs).toISOString(),
          en: new Date(w.endMs).toISOString(),
        },
      }),
    })
    const text = await res.text()
    if (!res.ok) throw new Error(`Cloudflare GraphQL ${res.status}: ${text.slice(0, 300)}`)
    const j = JSON.parse(text)
    if (j.errors?.length) throw new Error(`Cloudflare GraphQL: ${j.errors.map((e) => e.message).join('; ').slice(0, 300)}`)
    return shapeCfWeek(j.data?.viewer?.accounts?.[0])
  }
  const [thisWeek, lastWeek] = await Promise.all([week(win.thisWeek), week(win.lastWeek)])
  return {
    source: 'Cloudflare Web Analytics (cookieless; bots excluded)',
    note: 'Counts every visit, including visitors who declined the analytics banner, so it is the true traffic number. GA4/Clarity only see opted-in visitors. Referrer "(direct/none)" = no referrer; your own domain as referrer = internal navigation.',
    thisWeek,
    lastWeek,
  }
}

// --- GA4 ------------------------------------------------------------------

async function ga4Section(env, win) {
  if (!serviceAccountConfigured(env)) throw new Error('service account not configured')
  const property = env.GA4_PROPERTY_ID || DEFAULT_PROPERTY
  const token = await getGoogleAccessToken(env, GA_SCOPE)
  const dateRanges = [
    { startDate: win.thisWeek.start, endDate: win.thisWeek.end, name: 'thisWeek' },
    { startDate: win.lastWeek.start, endDate: win.lastWeek.end, name: 'lastWeek' },
  ]
  const web = { filter: { fieldName: 'platform', stringFilter: { value: 'web' } } }
  const run = (body) => runReport(token, property, { dateRanges, dimensionFilter: web, ...body })
  const bySessions = [{ metric: { metricName: 'sessions' }, desc: true }]

  const [overview, channels, sources, landingPages, devices, geo, newVsReturning, funnel] = await Promise.all([
    run({
      metrics: ['sessions', 'totalUsers', 'newUsers', 'engagedSessions', 'engagementRate', 'averageSessionDuration',
        'screenPageViews', 'bounceRate', 'ecommercePurchases', 'purchaseRevenue'].map((name) => ({ name })),
    }),
    run({ dimensions: [{ name: 'sessionDefaultChannelGroup' }], metrics: m('sessions', 'totalUsers', 'engagementRate', 'ecommercePurchases'), orderBys: bySessions, limit: 20 }),
    run({ dimensions: [{ name: 'sessionSourceMedium' }], metrics: m('sessions', 'engagementRate', 'ecommercePurchases'), orderBys: bySessions, limit: 20 }),
    run({ dimensions: [{ name: 'landingPage' }], metrics: m('sessions', 'engagementRate', 'averageSessionDuration', 'bounceRate', 'ecommercePurchases'), orderBys: bySessions, limit: 20 }),
    run({ dimensions: [{ name: 'deviceCategory' }], metrics: m('sessions', 'engagementRate', 'averageSessionDuration', 'ecommercePurchases'), orderBys: bySessions, limit: 10 }),
    run({ dimensions: [{ name: 'country' }, { name: 'region' }], metrics: m('sessions', 'totalUsers', 'ecommercePurchases'), orderBys: bySessions, limit: 20 }),
    run({ dimensions: [{ name: 'newVsReturning' }], metrics: m('sessions', 'totalUsers', 'engagementRate', 'ecommercePurchases'), limit: 10 }),
    runReport(token, property, {
      dateRanges,
      dimensions: [{ name: 'eventName' }],
      metrics: m('totalUsers', 'eventCount'),
      dimensionFilter: {
        andGroup: { expressions: [web, { filter: { fieldName: 'eventName', inListFilter: { values: FUNNEL } } }] },
      },
      limit: 50,
    }),
  ])

  return {
    property,
    overview: splitByRange(overview, false),
    channels: splitByRange(channels),
    sources: splitByRange(sources),
    landingPages: splitByRange(landingPages),
    devices: splitByRange(devices),
    geo: splitByRange(geo),
    newVsReturning: splitByRange(newVsReturning),
    funnel: funnelSteps(splitByRange(funnel)),
  }
}

const m = (...names) => names.map((name) => ({ name }))

async function runReport(token, property, body) {
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${property}:runReport`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`GA4 runReport ${res.status}: ${text.slice(0, 300)}`)
  return JSON.parse(text)
}

// Flatten a multi-date-range GA4 response into { thisWeek: [...], lastWeek: [...] }
// (or a single row per range when `asList` is false).
export function splitByRange(resp, asList = true) {
  const dims = (resp.dimensionHeaders || []).map((h) => h.name)
  const mets = (resp.metricHeaders || []).map((h) => h.name)
  const out = { thisWeek: [], lastWeek: [] }
  for (const row of resp.rows || []) {
    const rec = {}
    let range = 'thisWeek'
    dims.forEach((d, i) => {
      const v = row.dimensionValues[i].value
      if (d === 'dateRange') range = v
      else rec[d] = v
    })
    mets.forEach((mm, i) => {
      const n = Number(row.metricValues[i].value)
      rec[mm] = Number.isFinite(n) ? Math.round(n * 1000) / 1000 : row.metricValues[i].value
    })
    ;(out[range] ||= []).push(rec)
  }
  if (asList) return out
  const zero = Object.fromEntries(mets.map((mm) => [mm, 0]))
  return { thisWeek: out.thisWeek[0] || zero, lastWeek: out.lastWeek[0] || zero }
}

function funnelSteps(split) {
  const build = (rows) => {
    const byEvent = Object.fromEntries(rows.map((r) => [r.eventName, r.totalUsers]))
    let prev = null
    return FUNNEL.map((step) => {
      const users = byEvent[step] || 0
      const pctOfPrev = prev ? Math.round((users / prev) * 1000) / 10 : null
      prev = users
      return { step, users, pctOfPrev }
    })
  }
  return { thisWeek: build(split.thisWeek), lastWeek: build(split.lastWeek) }
}

// --- Stripe ---------------------------------------------------------------

async function stripeGetAll(env, path, params) {
  const all = []
  let startingAfter = null
  for (let page = 0; page < 20; page++) {
    const qs = new URLSearchParams(params)
    qs.set('limit', '100')
    if (startingAfter) qs.set('starting_after', startingAfter)
    const res = await fetch(`https://api.stripe.com/v1/${path}?${qs}`, {
      headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
    })
    const text = await res.text()
    if (!res.ok) throw new Error(`Stripe ${path} ${res.status}: ${text.slice(0, 300)}`)
    const j = JSON.parse(text)
    all.push(...j.data)
    if (!j.has_more || !j.data.length) break
    startingAfter = j.data[j.data.length - 1].id
  }
  return all
}

export function summarizeOrders(sessions, refunds) {
  const paid = sessions.filter((s) => s.payment_status === 'paid' || s.payment_status === 'no_payment_required')
  const cents = (n) => Math.round(n) / 100
  const units = {}
  let gross = 0, shipping = 0, tax = 0, discounts = 0, subtotal = 0
  const customers = new Set()
  for (const s of paid) {
    gross += s.amount_total || 0
    subtotal += s.amount_subtotal || 0
    shipping += s.total_details?.amount_shipping || 0
    tax += s.total_details?.amount_tax || 0
    discounts += s.total_details?.amount_discount || 0
    const email = s.customer_details?.email
    if (email) customers.add(email.toLowerCase())
    for (const [k, v] of Object.entries(s.metadata || {})) {
      if (!k.startsWith('qty_')) continue
      const n = Number(v) || 0
      if (n) units[k.slice(4)] = (units[k.slice(4)] || 0) + n
    }
  }
  const refundedOk = refunds.filter((r) => r.status === 'succeeded' || r.status === 'pending')
  const refunded = refundedOk.reduce((a, r) => a + (r.amount || 0), 0)
  return {
    orders: paid.length,
    uniqueCustomers: customers.size,
    grossRevenue: cents(gross),
    productSubtotal: cents(subtotal),
    shipping: cents(shipping),
    tax: cents(tax),
    discounts: cents(discounts),
    refunds: { count: refundedOk.length, amount: cents(refunded) },
    netRevenue: cents(gross - refunded),
    avgOrderValue: paid.length ? cents(gross / paid.length) : 0,
    unitsBySku: units,
    unpaidOrExpiredCheckouts: sessions.length - paid.length,
  }
}

async function stripeSection(env, win) {
  if (!env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not configured')
  const range = (w) => ({
    'created[gte]': String(Math.floor(w.startMs / 1000)),
    'created[lt]': String(Math.floor(w.endMs / 1000)),
  })
  const week = async (w) => {
    const [complete, refunds, abandoned] = await Promise.all([
      stripeGetAll(env, 'checkout/sessions', { ...range(w), status: 'complete' }),
      stripeGetAll(env, 'refunds', range(w)),
      stripeGetAll(env, 'checkout/sessions', { ...range(w), status: 'expired' }),
    ])
    return { ...summarizeOrders(complete, refunds), abandonedCheckouts: abandoned.length }
  }
  const [thisWeek, lastWeek] = await Promise.all([week(win.thisWeek), week(win.lastWeek)])
  return {
    mode: env.STRIPE_SECRET_KEY.startsWith('sk_live') || env.STRIPE_SECRET_KEY.startsWith('rk_live') ? 'live' : 'test',
    note: 'Orders = paid Stripe Checkout sessions created in the window. Abandoned = checkout sessions that expired unpaid (Stripe expires them after 24h). SKU keys: single = Tracker, dot = Sponge Dot, family = Family Pack, adhesive_3pack, coaster.',
    thisWeek,
    lastWeek,
  }
}

// --- Clarity --------------------------------------------------------------

async function claritySection(env, win, live) {
  const out = { note: 'Weekly figures are rolled up from daily snapshots (see daysCaptured). "live3d" is a direct pull of the last 3 days.' }
  let snaps = []
  try {
    snaps = serviceAccountConfigured(env) && env.GOOGLE_SHEET_ID ? await loadSnapshots(env) : []
  } catch (e) {
    out.snapshotError = String(e.message || e)
  }
  for (const [label, w] of [['thisWeek', win.thisWeek], ['lastWeek', win.lastWeek]]) {
    const inWeek = snaps.filter((s) => w.days.includes(s.date))
    const byDim = (dim) => inWeek.filter((s) => s.dimension === dim).map((s) => s.data)
    out[label] = {
      daysCaptured: [...new Set(inWeek.map((s) => s.date))].sort(),
      byUrl: aggregateSnapshots(byDim('URL'), 'URL'),
      byDevice: aggregateSnapshots(byDim('Device'), 'Device'),
    }
  }
  if (live && env.CLARITY_API_TOKEN) {
    try {
      const data = await fetchClarity(env.CLARITY_API_TOKEN, 3, 'URL')
      out.live3d = aggregateSnapshots([data], 'URL')
    } catch (e) {
      out.live3dError = String(e.message || e)
    }
  } else if (!env.CLARITY_API_TOKEN) {
    out.live3dError = 'CLARITY_API_TOKEN not configured'
  }
  out.frictionMetrics = FRICTION_METRICS
  return out
}

// --- Email signups (Subscribers tab; counts only, no addresses) -----------

async function signupSection(env, win) {
  if (!serviceAccountConfigured(env) || !env.GOOGLE_SHEET_ID) throw new Error('sheet not configured')
  const token = await getGoogleAccessToken(env, SHEETS_SCOPE)
  const tab = env.SUBSCRIBER_TAB_NAME || 'Subscribers'
  const range = encodeURIComponent(`'${tab}'!A2:D`)
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEET_ID}/values/${range}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 400) return { total: 0, thisWeek: { count: 0, bySource: {} }, lastWeek: { count: 0, bySource: {} } }
  if (!res.ok) throw new Error(`Sheets ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const rows = (await res.json()).values || []
  const iso = (mdy) => {
    const mt = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(mdy || '').trim())
    return mt ? `${mt[3]}-${mt[1].padStart(2, '0')}-${mt[2].padStart(2, '0')}` : null
  }
  const count = (w) => {
    const hit = rows.filter((r) => w.days.includes(iso(r[1])))
    const bySource = {}
    for (const r of hit) bySource[r[2] || 'site'] = (bySource[r[2] || 'site'] || 0) + 1
    return { count: hit.length, bySource }
  }
  return { total: rows.length, thisWeek: count(win.thisWeek), lastWeek: count(win.lastWeek), note: 'Dates are recorded in UTC, so counts near midnight can shift a day.' }
}

// --- App (retention API) --------------------------------------------------

export function summarizeApp(data, win) {
  const users = Object.values(data || {}).filter(
    (u) => u && !/test/i.test(u.name || '') && !(u.first_active && u.first_active < '2000-01-01')
  )
  const week = (w) => {
    const active = users.filter((u) => w.days.some((d) => (u.daily_measurements?.[d] || 0) > 0))
    const measurements = users.reduce((a, u) => a + w.days.reduce((s, d) => s + (u.daily_measurements?.[d] || 0), 0), 0)
    return {
      newUsers: users.filter((u) => w.days.includes(u.first_active)).length,
      weeklyActiveUsers: active.length,
      totalMeasurements: measurements,
      activeDaysPerActiveUser: active.length
        ? Math.round((active.reduce((a, u) => a + w.days.filter((d) => (u.daily_measurements?.[d] || 0) > 0).length, 0) / active.length) * 10) / 10
        : 0,
    }
  }
  return {
    totalUsers: users.length,
    note: 'Excludes accounts named "test" and first_active dates before 2000.',
    thisWeek: week(win.thisWeek),
    lastWeek: week(win.lastWeek),
  }
}

async function appSection(win) {
  const res = await fetch(RETENTION_API)
  if (!res.ok) throw new Error(`retention API ${res.status}`)
  return summarizeApp(await res.json(), win)
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj, null, 2), { status, headers: { 'content-type': 'application/json' } })
}
