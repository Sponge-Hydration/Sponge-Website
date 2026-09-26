// Daily Microsoft Clarity snapshot → "Clarity Daily" tab of the order-log sheet.
//
// Clarity's export API only covers the last 1–3 days (and ~10 calls/day), so a
// scheduled task GETs this once a day; weekly-site-report.js then rolls the
// stored days up into a week. Two API calls per run (by URL and by Device).
//
// Env: CLARITY_API_TOKEN, GA4_REPORT_TOKEN (shared trigger key),
//      GOOGLE_SA_EMAIL / GOOGLE_SA_PRIVATE_KEY / GOOGLE_SHEET_ID
//
// Trigger:  GET /api/clarity-snapshot?key=<GA4_REPORT_TOKEN>
//           add &dry=1 to fetch without writing to the sheet.

import { fetchClarity, saveSnapshots, trimSnapshot } from './_clarity.js'
import { serviceAccountConfigured } from './_google-sa.js'
import { ptDate } from './_report-dates.js'

const DIMENSIONS = ['URL', 'Device']

export async function onRequest({ request, env }) {
  const url = new URL(request.url)
  const provided = url.searchParams.get('key') || request.headers.get('x-report-token')
  if (!env.GA4_REPORT_TOKEN) return json({ error: 'GA4_REPORT_TOKEN not configured' }, 500)
  if (provided !== env.GA4_REPORT_TOKEN) return json({ error: 'unauthorized' }, 401)
  if (!env.CLARITY_API_TOKEN) return json({ error: 'CLARITY_API_TOKEN not configured' }, 500)
  const dry = url.searchParams.get('dry') === '1'
  if (!dry && !(serviceAccountConfigured(env) && env.GOOGLE_SHEET_ID)) {
    return json({ error: 'service account / GOOGLE_SHEET_ID not configured' }, 500)
  }

  try {
    const date = ptDate()
    const rows = []
    for (const dimension of DIMENSIONS) {
      const data = await fetchClarity(env.CLARITY_API_TOKEN, 1, dimension)
      rows.push({ date, dimension, days: 1, data })
    }
    if (!dry) await saveSnapshots(env, rows)
    return json({
      ok: true,
      saved: !dry,
      date,
      snapshots: rows.map((r) => ({
        dimension: r.dimension,
        metrics: (r.data || []).map((m) => m.metricName),
        bytes: JSON.stringify(trimSnapshot(r.data)).length,
      })),
    })
  } catch (e) {
    return json({ error: String(e.message || e) }, 500)
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj, null, 2), { status, headers: { 'content-type': 'application/json' } })
}
