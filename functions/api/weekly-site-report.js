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
//   priceTest price A/B test (src/pricing.js): Stripe + GA4 funnel per arm,
//             since the test started and this week, with a significance check
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
//           &section=traffic|videos|ga4|stripe|clarity|signups|app|priceTest to return one section only

import { getGoogleAccessToken, serviceAccountConfigured } from './_google-sa.js'
import { aggregateSnapshots, fetchClarity, loadSnapshots, FRICTION_METRICS } from './_clarity.js'
import { reportWindows, ptDate, ptMidnight } from './_report-dates.js'
import { loadClicks, loadLinkTable, summarizeClicks } from './_video-links.js'

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
    videos: () => videoSection(env, win),
    ga4: () => ga4Section(env, win),
    stripe: () => stripeSection(env, win),
    clarity: () => claritySection(env, win, live),
    signups: () => signupSection(env, win),
    app: () => appSection(win),
    priceTest: () => priceTestSection(env, win),
    // Diagnostic: which Web Analytics site ids are receiving visits, by day.
    trafficSites: () => trafficSitesSection(env, win),
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

// No orderBy: sorted queries get sampled far more heavily (every value came
// back a multiple of 10). Unsorted groups come back ~unsampled; we sort here.
const CF_QUERY = `query($a: string!, $s: string!, $st: Time!, $en: Time!) {
  viewer { accounts(filter: { accountTag: $a }) {
    total: rumPageloadEventsAdaptiveGroups(limit: 1, filter: { siteTag: $s, datetime_geq: $st, datetime_lt: $en, bot: 0 }) { count sum { visits } }
    pages: rumPageloadEventsAdaptiveGroups(limit: 2000, filter: { siteTag: $s, datetime_geq: $st, datetime_lt: $en, bot: 0 }) { count sum { visits } dimensions { requestPath } }
    referrers: rumPageloadEventsAdaptiveGroups(limit: 2000, filter: { siteTag: $s, datetime_geq: $st, datetime_lt: $en, bot: 0 }) { count sum { visits } dimensions { refererHost } }
    devices: rumPageloadEventsAdaptiveGroups(limit: 20, filter: { siteTag: $s, datetime_geq: $st, datetime_lt: $en, bot: 0 }) { count sum { visits } dimensions { deviceType } }
    countries: rumPageloadEventsAdaptiveGroups(limit: 300, filter: { siteTag: $s, datetime_geq: $st, datetime_lt: $en, bot: 0 }) { count sum { visits } dimensions { countryName } }
    hourly: rumPageloadEventsAdaptiveGroups(limit: 5000, filter: { siteTag: $s, datetime_geq: $st, datetime_lt: $en, bot: 0 }) { sum { visits } dimensions { datetimeHour refererHost } }
  } }
}`

// Which platform a referrer host belongs to. Many in-app browsers (TikTok,
// Instagram) send no referrer at all, so social traffic also shows up as
// "direct"; the report reads direct spikes right after a post as likely social.
export function platformOf(host = '') {
  const h = String(host).toLowerCase()
  if (!h) return 'direct'
  if (/spongehydration/.test(h)) return 'internal'
  if (/tiktok|musical\.ly|bytedance/.test(h)) return 'tiktok'
  if (/instagram/.test(h)) return 'instagram'
  if (/youtube|youtu\.be/.test(h)) return 'youtube'
  if (/facebook|^fb\.|messenger/.test(h)) return 'facebook'
  if (/reddit/.test(h)) return 'reddit'
  if (/(^|\.)t\.co$|twitter|x\.com/.test(h)) return 'x'
  if (/chatgpt|openai|perplexity|claude\.ai|gemini|copilot/.test(h)) return 'ai'
  if (/google\.|bing\.|duckduckgo|yahoo\./.test(h)) return 'search'
  if (/stripe/.test(h)) return 'stripe'
  return 'other'
}

const PT_HOUR = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' })
const ptHourLabel = (iso) => {
  const p = Object.fromEntries(PT_HOUR.formatToParts(new Date(iso)).map((x) => [x.type, x.value]))
  return { date: `${p.year}-${p.month}-${p.day}`, hour: `${p.year}-${p.month}-${p.day} ${p.hour}:00` }
}

// Day-by-day and hour-by-hour visits per platform (Pacific time). Hours with
// no external visits are omitted to keep the payload small.
export function timelines(hourlyRows = []) {
  const daily = {}
  const hourly = {}
  for (const r of hourlyRows) {
    const v = r.sum?.visits || 0
    if (!v || !r.dimensions?.datetimeHour) continue
    const plat = platformOf(r.dimensions.refererHost)
    if (plat === 'internal') continue
    const { date, hour } = ptHourLabel(r.dimensions.datetimeHour)
    daily[date] ||= { date, total: 0 }
    daily[date].total += v
    daily[date][plat] = (daily[date][plat] || 0) + v
    hourly[hour] ||= { hourPT: hour, total: 0 }
    hourly[hour].total += v
    hourly[hour][plat] = (hourly[hour][plat] || 0) + v
  }
  const byKey = (k) => (a, b) => (a[k] < b[k] ? -1 : 1)
  return { dailyByPlatform: Object.values(daily).sort(byKey('date')), hourlyByPlatform: Object.values(hourly).sort(byKey('hourPT')) }
}

export function shapeCfWeek(acct) {
  const rows = (list, dim, n) =>
    (list || [])
      .map((r) => ({ [dim]: r.dimensions?.[dim] || '(direct/none)', visits: r.sum?.visits || 0, pageViews: r.count || 0 }))
      .sort((a, b) => b.visits - a.visits || b.pageViews - a.pageViews)
      .slice(0, n)
  const t = acct?.total?.[0]
  const refs = rows(acct?.referrers, 'refererHost', 2000)
  const byPlatform = {}
  for (const r of refs) {
    const p = platformOf(r.refererHost === '(direct/none)' ? '' : r.refererHost)
    if (p !== 'internal') byPlatform[p] = (byPlatform[p] || 0) + r.visits
  }
  return {
    visits: t?.sum?.visits || 0,
    pageViews: t?.count || 0,
    visitsByPlatform: byPlatform,
    topPages: rows(acct?.pages, 'requestPath', 10),
    referrers: refs.slice(0, 15),
    devices: rows(acct?.devices, 'deviceType', 5),
    countries: rows(acct?.countries, 'countryName', 8),
    ...timelines(acct?.hourly),
  }
}

// Diagnostic for "traffic dropped to zero": lists every Web Analytics site id
// (siteTag) and hostname that received visits over the two report weeks. If the
// beacon is live but `traffic` is empty, the site was probably re-created in
// Cloudflare and now reports under a new siteTag.
async function trafficSitesSection(env, win) {
  if (!env.CF_ANALYTICS_TOKEN) throw new Error('CF_ANALYTICS_TOKEN not configured')
  const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.CF_ANALYTICS_TOKEN}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      query: `query($a: string!, $st: Time!, $en: Time!) { viewer { accounts(filter: { accountTag: $a }) {
        sites: rumPageloadEventsAdaptiveGroups(limit: 2000, filter: { datetime_geq: $st, datetime_lt: $en, bot: 0 }) { count sum { visits } dimensions { siteTag requestHost date } }
      } } }`,
      variables: { a: env.CF_ACCOUNT_ID || CF_ACCOUNT, st: new Date(win.lastWeek.startMs).toISOString(), en: new Date(win.thisWeek.endMs).toISOString() },
    }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Cloudflare GraphQL ${res.status}: ${text.slice(0, 300)}`)
  const j = JSON.parse(text)
  if (j.errors?.length) throw new Error(`Cloudflare GraphQL: ${j.errors.map((e) => e.message).join('; ').slice(0, 300)}`)
  const rows = (j.data?.viewer?.accounts?.[0]?.sites || []).map((r) => ({ ...r.dimensions, visits: r.sum.visits, pageViews: r.count }))
  rows.sort((x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : y.visits - x.visits))
  return { configuredSiteTag: env.CF_WA_SITE_TAG || CF_SITE_TAG, rows }
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
    note: 'Counts every visit, including visitors who declined the analytics banner, so it is the true traffic number. GA4/Clarity only see opted-in visitors. visitsByPlatform / dailyByPlatform / hourlyByPlatform (Pacific time) group referrers by platform; "direct" = no referrer, which includes many TikTok/Instagram in-app browser visits, so a direct spike right after a post is likely social.',
    thisWeek,
    lastWeek,
  }
}

// --- Per-video tracked links (/v/<slug>) ------------------------------------

async function videoSection(env, win) {
  if (!serviceAccountConfigured(env) || !env.GOOGLE_SHEET_ID) throw new Error('sheet not configured')
  const [links, clicks] = await Promise.all([loadLinkTable(env), loadClicks(env)])
  return {
    note: 'Human clicks on spongehydration.com/v/<slug> links, from the "Video Links" / "Video Clicks" sheet tabs. Bot and link-preview hits are excluded. Views per video come from Metricool, not from here.',
    linksDefined: Object.values(links),
    thisWeek: summarizeClicks(clicks, links, win.thisWeek.startMs, win.thisWeek.endMs),
    lastWeek: summarizeClicks(clicks, links, win.lastWeek.startMs, win.lastWeek.endMs),
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
  const heardAbout = {}
  for (const s of paid) {
    const f = (s.custom_fields || []).find((x) => x.key === 'heardabout')
    const v = f?.dropdown?.value || 'not answered'
    heardAbout[v] = (heardAbout[v] || 0) + 1
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
    heardAbout,
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
  const [thisWeek, lastWeek, priceTest] = await Promise.all([
    week(win.thisWeek), week(win.lastWeek),
    // The Sunday task already fetches this section, so the price A/B results
    // ride along here too (also available alone as ?section=priceTest).
    priceTestSection(env, win).catch((e) => ({ error: String(e?.message || e) })),
  ])
  return {
    priceTest: {
      reportGuidance: 'Add a "PRICE TEST (A vs B)" section right after SALES: per arm, since the test started and this week, show checkouts started, orders, checkout conversion, revenue, AOV and tracker units, plus the GA4 funnel per arm. Then one verdict sentence that follows the enoughData / pValue / note fields exactly. If enoughData is false, say it is too early to call; never declare a winner otherwise. GA4 covers only visitors who accepted analytics.',
      ...priceTest,
    },
    mode: env.STRIPE_SECRET_KEY.startsWith('sk_live') || env.STRIPE_SECRET_KEY.startsWith('rk_live') ? 'live' : 'test',
    note: 'Orders = paid Stripe Checkout sessions created in the window. Abandoned = checkout sessions that expired unpaid (Stripe expires them after 24h). SKU keys: single = Tracker, dot = Sponge Dot, family = Family Pack, adhesive_3pack, coaster. heardAbout = answers to the optional "How did you hear about us?" checkout dropdown (started 2026-09-26).',
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

// --- Price A/B test ------------------------------------------------------------
// A: Tracker $64.99 + free shipping. B: Tracker $59.99 + flat $5 shipping (whole
// order in both). Stripe tags every session metadata[price_variant]; GA4 has the
// user property price_variant (user-scoped custom dimension, registered by the
// team on 2026-10-02, so GA4 per-arm data starts then).

export const PRICE_TEST_START = '2026-10-02'
const ARMS = ['A', 'B']

// Group Stripe Checkout sessions by arm. Internal (team test) sessions are
// excluded; sessions from before the test have no tag and are counted apart.
export function summarizePriceTest(sessions) {
  const blank = () => ({ checkoutsStarted: 0, orders: 0, abandoned: 0, revenue: 0, productSubtotal: 0, shipping: 0, trackerUnits: 0 })
  const arms = { A: blank(), B: blank() }
  let untagged = 0, internal = 0
  for (const s of sessions) {
    const md = s.metadata || {}
    if (md.internal === '1') { internal++; continue }
    const arm = arms[md.price_variant]
    if (!arm) { untagged++; continue }
    arm.checkoutsStarted++
    const paid = s.payment_status === 'paid' || s.payment_status === 'no_payment_required'
    if (paid) {
      arm.orders++
      arm.revenue += s.amount_total || 0
      arm.productSubtotal += s.amount_subtotal || 0
      arm.shipping += s.total_details?.amount_shipping || 0
      arm.trackerUnits += Number(md.qty_single) || 0
    } else if (s.status === 'expired') arm.abandoned++
  }
  for (const a of Object.values(arms)) {
    for (const k of ['revenue', 'productSubtotal', 'shipping']) a[k] = Math.round(a[k]) / 100
    a.checkoutConversion = a.checkoutsStarted ? Math.round((a.orders / a.checkoutsStarted) * 1000) / 10 : null
    a.avgOrderValue = a.orders ? Math.round((a.revenue / a.orders) * 100) / 100 : 0
  }
  return { ...arms, untaggedSessions: untagged, internalSessionsExcluded: internal }
}

// Two-proportion z-test (two-sided). Plain-language enoughData flag so the
// report never crowns a winner on a handful of orders.
export function twoProportion(x1, n1, x2, n2) {
  if (!n1 || !n2) return { enoughData: false, note: 'no data in one or both arms yet' }
  const p1 = x1 / n1, p2 = x2 / n2, p = (x1 + x2) / (n1 + n2)
  const se = Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2))
  const z = se ? (p1 - p2) / se : 0
  const pValue = se ? 2 * (1 - normCdf(Math.abs(z))) : 1
  const enoughData = x1 + x2 >= 20 && n1 >= 100 && n2 >= 100
  const r = (v) => Math.round(v * 10000) / 10000
  return {
    rateA: r(p1), rateB: r(p2), z: Math.round(z * 100) / 100, pValue: r(pValue),
    enoughData,
    note: !enoughData
      ? 'Not enough data to call a winner (need 20+ conversions and 100+ in each arm).'
      : pValue < 0.05 ? `Arm ${p1 > p2 ? 'A' : 'B'} converts better (p < 0.05).` : 'No significant difference yet (p >= 0.05).',
  }
}

function normCdf(x) {
  // Abramowitz-Stegun 7.1.26 erf approximation (error < 1.5e-7).
  const t = 1 / (1 + 0.3275911 * (x / Math.SQRT2))
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(x * x) / 2)
  return 0.5 * (1 + y)
}

async function priceTestSection(env, win) {
  const sinceStart = { start: PRICE_TEST_START, end: win.thisWeek.end, startMs: ptMidnight(PRICE_TEST_START), endMs: win.thisWeek.endMs }
  const out = {
    arms: { A: 'Tracker $64.99 + free shipping (whole order)', B: 'Tracker $59.99 + $5 flat shipping (whole order)' },
    note: 'One Tracker is $64.99 delivered in both arms, so this measures framing (free shipping vs lower price). Stripe counts every buyer; GA4 only visitors who accepted analytics. Internal team test checkouts are excluded.',
    since: PRICE_TEST_START,
  }

  // Stripe: every Checkout session in the window, split by arm.
  if (env.STRIPE_SECRET_KEY) {
    const sessionsIn = (w) => stripeGetAll(env, 'checkout/sessions', {
      'created[gte]': String(Math.floor(w.startMs / 1000)),
      'created[lt]': String(Math.floor(w.endMs / 1000)),
    })
    try {
      const [all, week] = await Promise.all([sessionsIn(sinceStart), sessionsIn(win.thisWeek)])
      const s = summarizePriceTest(all)
      out.stripe = {
        sinceStart: s,
        thisWeek: summarizePriceTest(week),
        checkoutConversionTest: twoProportion(s.A.orders, s.A.checkoutsStarted, s.B.orders, s.B.checkoutsStarted),
      }
    } catch (e) { out.stripe = { error: String(e?.message || e) } }
  } else out.stripe = { error: 'STRIPE_SECRET_KEY not configured' }

  // GA4: funnel users per arm (consenting visitors only).
  if (serviceAccountConfigured(env)) {
    try {
      const property = env.GA4_PROPERTY_ID || DEFAULT_PROPERTY
      const token = await getGoogleAccessToken(env, GA_SCOPE)
      const web = { filter: { fieldName: 'platform', stringFilter: { value: 'web' } } }
      const funnelFor = async (w) => {
        const resp = await runReport(token, property, {
          dateRanges: [{ startDate: w.start, endDate: w.end }],
          dimensions: [{ name: 'customUser:price_variant' }, { name: 'eventName' }],
          metrics: m('totalUsers'),
          dimensionFilter: { andGroup: { expressions: [web, { filter: { fieldName: 'eventName', inListFilter: { values: FUNNEL } } }] } },
          limit: 100,
        })
        const byArm = { A: {}, B: {} }
        for (const row of resp.rows || []) {
          const [arm, ev] = row.dimensionValues.map((d) => d.value)
          if (byArm[arm]) byArm[arm][ev] = Number(row.metricValues[0].value)
        }
        return Object.fromEntries(ARMS.map((a) => [a, FUNNEL.map((step) => ({ step, users: byArm[a][step] || 0 }))]))
      }
      const [all, week] = await Promise.all([funnelFor(sinceStart), funnelFor(win.thisWeek)])
      const users = (f, step) => f.find((x) => x.step === step)?.users || 0
      out.ga4 = {
        sinceStart: all,
        thisWeek: week,
        viewToPurchaseTest: twoProportion(users(all.A, 'purchase'), users(all.A, 'view_item'), users(all.B, 'purchase'), users(all.B, 'view_item')),
      }
    } catch (e) { out.ga4 = { error: String(e?.message || e) } }
  } else out.ga4 = { error: 'service account not configured' }

  return out
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj, null, 2), { status, headers: { 'content-type': 'application/json' } })
}
