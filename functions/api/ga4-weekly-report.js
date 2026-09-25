// Weekly GA4 funnel report, emailed to the team.
//
// Runs server-side in Cloudflare (where the service-account key and Gmail
// credentials already live), so no secret ever leaves the platform. A
// lightweight external scheduler just needs to GET this URL once a week — it
// carries no secrets itself, only the shared trigger token.
//
// Pulls the view_item → add_to_cart → begin_checkout → purchase funnel from the
// GA4 property that owns G-DGZGWC184G (property 437571529), filtered to
// platform=web, and emails a formatted summary via the existing Gmail sender.
//
// Env vars (all already set in Cloudflare except GA4_REPORT_TOKEN):
//   GOOGLE_SA_EMAIL, GOOGLE_SA_PRIVATE_KEY  — service account (analytics.readonly)
//   GMAIL_* / ORDER_FROM_EMAIL              — used by sendGmail()
//   GA4_REPORT_TOKEN                        — shared secret; caller must match it
//   GA4_PROPERTY_ID  (optional)             — defaults to 437571529
//   GA4_REPORT_TO    (optional)             — defaults to team@spongehydration.com
//
// Trigger:  GET /api/ga4-weekly-report?key=<GA4_REPORT_TOKEN>

import { sendGmail, gmailConfigured } from './_integrations.js'

const SCOPE = 'https://www.googleapis.com/auth/analytics.readonly'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const DEFAULT_PROPERTY = '437571529'
const DEFAULT_TO = 'team@spongehydration.com'
const FUNNEL = ['session_start', 'view_item', 'add_to_cart', 'begin_checkout', 'purchase']
const STEP_LABELS = {
  session_start: 'Sessions started',
  view_item: 'Viewed a product',
  add_to_cart: 'Added to cart',
  begin_checkout: 'Began checkout',
  purchase: 'Purchased',
}

// --- service-account JWT (Web Crypto, mirrors _sheets.js) -----------------

function b64urlBytes(bytes) {
  let s = ''
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
const b64urlStr = (str) => b64urlBytes(new TextEncoder().encode(str))

function pemToArrayBuffer(pem) {
  const body = pem
    .replace(/\\n/g, '\n')
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '')
  const bin = atob(body)
  const buf = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i)
  return buf.buffer
}

async function getAccessToken(env) {
  const now = Math.floor(Date.now() / 1000)
  const header = b64urlStr(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claim = b64urlStr(
    JSON.stringify({ iss: env.GOOGLE_SA_EMAIL, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 })
  )
  const signingInput = `${header}.${claim}`
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(env.GOOGLE_SA_PRIVATE_KEY),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signingInput))
  const jwt = `${signingInput}.${b64urlBytes(sig)}`
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  })
  const j = await res.json()
  if (!res.ok) throw new Error(`token exchange failed: ${res.status} ${JSON.stringify(j)}`)
  return j.access_token
}

// --- GA4 web funnel -------------------------------------------------------

async function runFunnel(token, propertyId, startDate, endDate) {
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'totalUsers' }],
      dimensionFilter: {
        andGroup: {
          expressions: [
            { filter: { fieldName: 'eventName', inListFilter: { values: FUNNEL } } },
            { filter: { fieldName: 'platform', stringFilter: { value: 'web' } } },
          ],
        },
      },
      limit: 100,
    }),
  })
  const j = await res.json()
  if (!res.ok) throw new Error(`runReport failed: ${res.status} ${JSON.stringify(j)}`)
  const byEvent = {}
  for (const r of j.rows || []) byEvent[r.dimensionValues[0].value] = Number(r.metricValues[0].value)
  const top = byEvent[FUNNEL[0]] || 0
  let prev = null
  const steps = FUNNEL.map((step) => {
    const users = byEvent[step] || 0
    const pctPrev = prev == null ? null : prev === 0 ? null : (users / prev) * 100
    const dropPrev = prev == null ? null : prev - users
    prev = users
    return { step, users, pctPrev, dropPrev }
  })
  return { steps, top }
}

// --- email formatting -----------------------------------------------------

function biggestDrop(steps) {
  let worst = null
  for (let i = 1; i < steps.length; i++) {
    const s = steps[i]
    if (s.pctPrev == null) continue
    const lostPct = 100 - s.pctPrev
    if (!worst || lostPct > worst.lostPct) {
      worst = { from: STEP_LABELS[steps[i - 1].step], to: STEP_LABELS[s.step], lostPct, dropUsers: s.dropPrev }
    }
  }
  return worst
}

function reportHtml(propertyId, report) {
  const { steps, top } = report
  const rows = steps
    .map((s) => {
      const pctPrev = s.pctPrev == null ? '-' : `${s.pctPrev.toFixed(1)}%`
      const pctTop = top === 0 ? '-' : `${((s.users / top) * 100).toFixed(1)}%`
      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee">${STEP_LABELS[s.step]}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:700">${s.users}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">${pctPrev}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;color:#666">${pctTop}</td>
      </tr>`
    })
    .join('')
  const drop = biggestDrop(steps)
  const insight =
    top === 0
      ? `<p style="color:#9a3412;background:#fff7ed;border:1px solid #fed7aa;padding:12px 14px;border-radius:8px">No web funnel data in this window yet. If the property was set up recently, give it a few days of traffic.</p>`
      : drop
      ? `<p style="font-size:15px"><strong>Biggest drop-off:</strong> ${drop.from} → ${drop.to}, lost <strong>${drop.lostPct.toFixed(1)}%</strong> (${drop.dropUsers} users).</p>`
      : ''
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;color:#111">
    <h2 style="margin:0 0 4px">Weekly funnel: Sponge Hydration</h2>
    <p style="color:#666;margin:0 0 16px;font-size:13px">Last 7 days · web only · GA4 property ${propertyId}</p>
    ${insight}
    <table style="border-collapse:collapse;width:100%;font-size:14px;margin-top:10px">
      <thead><tr style="text-align:left;color:#666;font-size:12px;text-transform:uppercase">
        <th style="padding:8px 12px">Step</th>
        <th style="padding:8px 12px;text-align:right">Users</th>
        <th style="padding:8px 12px;text-align:right">% of prev</th>
        <th style="padding:8px 12px;text-align:right">% of top</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="color:#999;font-size:12px;margin-top:20px">Automated weekly report · GA4 Data API · generated ${new Date().toUTCString()}</p>
  </div>`
}

// --- handler --------------------------------------------------------------

export async function onRequest(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const provided = url.searchParams.get('key') || request.headers.get('x-report-token')

  if (!env.GA4_REPORT_TOKEN) return json({ error: 'GA4_REPORT_TOKEN not configured' }, 500)
  if (provided !== env.GA4_REPORT_TOKEN) return json({ error: 'unauthorized' }, 401)
  if (!env.GOOGLE_SA_EMAIL || !env.GOOGLE_SA_PRIVATE_KEY) return json({ error: 'service account not configured' }, 500)
  if (!gmailConfigured(env)) return json({ error: 'gmail not configured' }, 500)

  const propertyId = env.GA4_PROPERTY_ID || DEFAULT_PROPERTY
  const to = env.GA4_REPORT_TO || DEFAULT_TO

  try {
    const token = await getAccessToken(env)
    const report = await runFunnel(token, propertyId, '7daysAgo', 'today')
    const html = reportHtml(propertyId, report)
    const dryRun = url.searchParams.get('dry') === '1'
    if (!dryRun) {
      await sendGmail(env, { to, subject: 'Weekly funnel: Sponge Hydration', html })
    }
    return json({ ok: true, emailed: !dryRun, to, propertyId, steps: report.steps })
  } catch (e) {
    return json({ error: String(e.message || e) }, 500)
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj, null, 2), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}
