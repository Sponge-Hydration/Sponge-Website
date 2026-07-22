// Cloudflare Pages Function: /api/reviews
//
//   GET   -> approved customer reviews, for the site to display
//   POST  -> writes a new review submission into the Airtable reviews table
//
// The site updates the moment a review is approved in Airtable - no redeploy.
// GET responses are edge-cached for 10 minutes to keep API usage negligible.
//
// Required env vars (set in the Cloudflare Pages dashboard, never committed):
//   AIRTABLE_API_KEY        personal access token (data.records:read + :write)
//   AIRTABLE_BASE_ID        base id, looks like appXXXXXXXXXXXXXX
//   AIRTABLE_REVIEWS_TABLE  table name or id (defaults to "Reviews")
//
// Airtable column names - verified against the live base (apppnrhDp10j1dZ7c).
const FIELDS = {
  overall: 'Overall Rating', // number 1-5
  device: 'Device Rating', // Great / Good / Okay / Poor
  app: 'App Rating',
  setup: 'Setup Rating',
  packaging: 'Packaging Rating',
  discovery: 'Discovery Source', // e.g. Instagram / Friend or family / Other
  useCases: 'Use Cases', // TEXT field storing a comma-separated list
  feedback: 'Open Feedback', // long text
  email: 'Email', // optional
  nps: 'NPS Score', // optional number 0-10
}

// Which column decides whether a review is shown on the site. Add a checkbox
// column with one of these names and check the reviews you want live. Until a
// review is checked it stays private in Airtable and the site shows the curated
// set in src/data.js.
const APPROVED_ALIASES = ['approved', 'published', 'show on site', 'live', 'featured']

const json = (data, status = 200, extraHeaders = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', ...extraHeaders },
  })

const lowerKeys = (obj) =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [k.trim().toLowerCase(), v]))

function airtableUrl(env) {
  const table = encodeURIComponent(env.AIRTABLE_REVIEWS_TABLE || 'Reviews')
  return `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${table}`
}

// --- GET: approved reviews for display --------------------------------------

export async function onRequestGet(context) {
  const { request, env } = context
  if (!env.AIRTABLE_API_KEY || !env.AIRTABLE_BASE_ID) {
    return json({ error: 'Reviews are not configured.' }, 503)
  }

  const cache = caches.default
  const cacheKey = new Request(new URL('/api/reviews', request.url).toString())
  const cached = await cache.match(cacheKey)
  if (cached) return cached

  let payload
  try {
    const res = await fetch(`${airtableUrl(env)}?maxRecords=100`, {
      headers: { Authorization: `Bearer ${env.AIRTABLE_API_KEY}` },
    })
    if (!res.ok) throw new Error(`Airtable ${res.status}`)
    payload = await res.json()
  } catch (err) {
    console.error('reviews GET failed:', err?.message || err)
    return json({ error: 'Could not load reviews.' }, 502)
  }

  const reviews = (payload.records || [])
    .map((rec) => {
      const f = rec.fields || {}
      const lf = lowerKeys(f)
      const approvedKey = APPROVED_ALIASES.find((a) => a in lf)
      // "Use Cases" is a comma-separated text field; normalize to " · ".
      const raw = f[FIELDS.useCases]
      const useCases = (Array.isArray(raw) ? raw : String(raw || '').split(','))
        .map((s) => s.trim())
        .filter(Boolean)
      return {
        stars: Math.max(1, Math.min(5, Math.round(Number(f[FIELDS.overall]) || 5))),
        quote: String(f[FIELDS.feedback] || '').trim(),
        loc: useCases.slice(0, 3).join(' · '),
        approved: approvedKey ? Boolean(lf[approvedKey]) : false,
      }
    })
    // Only show reviews that are explicitly approved AND have written feedback.
    .filter((r) => r.approved && r.quote)
    .map(({ approved, ...r }) => r)

  const response = json({ reviews }, 200, { 'cache-control': 'public, max-age=600' })
  context.waitUntil(cache.put(cacheKey, response.clone()))
  return response
}

// --- POST: write a new review submission ------------------------------------

const RATING_WORDS = ['Great', 'Good', 'Okay', 'Poor']

export async function onRequestPost({ request, env }) {
  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid request.' }, 400)
  }

  // Honeypot: real users never fill this hidden field.
  if (body.website) return json({ ok: true })

  const overall = Math.round(Number(body.overall))
  if (!Number.isFinite(overall) || overall < 1 || overall > 5) {
    return json({ error: 'Please choose an overall rating from 1 to 5 stars.' }, 400)
  }
  const feedback = String(body.feedback || '').trim().slice(0, 5000)
  if (!feedback) {
    return json({ error: 'Please share a few words about your experience.' }, 400)
  }

  if (!env.AIRTABLE_API_KEY || !env.AIRTABLE_BASE_ID) {
    return json({ error: 'Reviews are not available right now.' }, 503)
  }

  // Build the Airtable record, only including fields the user actually answered.
  const fields = { [FIELDS.overall]: overall, [FIELDS.feedback]: feedback }
  const rating = (v) => (RATING_WORDS.includes(v) ? v : undefined)
  if (rating(body.device)) fields[FIELDS.device] = body.device
  if (rating(body.app)) fields[FIELDS.app] = body.app
  if (rating(body.setup)) fields[FIELDS.setup] = body.setup
  if (rating(body.packaging)) fields[FIELDS.packaging] = body.packaging
  if (body.discovery) fields[FIELDS.discovery] = String(body.discovery).slice(0, 100)
  // "Use Cases" is a text field - store the selections as a comma-separated list.
  if (Array.isArray(body.useCases) && body.useCases.length) {
    fields[FIELDS.useCases] = body.useCases.map((u) => String(u).slice(0, 60)).slice(0, 12).join(', ')
  }
  const email = String(body.email || '').trim().slice(0, 200)
  if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fields[FIELDS.email] = email
  const nps = Math.round(Number(body.nps))
  if (Number.isFinite(nps) && nps >= 0 && nps <= 10) fields[FIELDS.nps] = nps

  try {
    const res = await fetch(airtableUrl(env), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.AIRTABLE_API_KEY}`,
        'content-type': 'application/json',
      },
      // typecast lets Airtable match/create select options from our text values.
      body: JSON.stringify({ records: [{ fields }], typecast: true }),
    })
    if (!res.ok) {
      const detail = await res.text()
      console.error('reviews POST rejected:', res.status, detail)
      return json({ error: 'Could not submit your review.' }, 502)
    }
  } catch (err) {
    console.error('reviews POST failed:', err?.message || err)
    return json({ error: 'Could not submit your review.' }, 502)
  }

  return json({ ok: true })
}
