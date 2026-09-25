#!/usr/bin/env node
// Microsoft Clarity insights puller.
//
// Uses the Clarity Data Export API to pull aggregated behavioural metrics —
// rage clicks, dead clicks, quick-backs, excessive scrolling, script errors,
// scroll depth, engagement — so we can find friction without watching replays
// one by one. Reads CLARITY_API_TOKEN from .dev.vars at the repo root.
//
// ⚠️ API LIMIT: the live-insights export only covers the last 1–3 days, and is
// rate-limited to a handful of calls per day. Run it when you want a snapshot;
// it is not a historical report.
//
// Usage:
//   node scripts/clarity-insights.mjs            # last 3 days, broken down by URL
//   node scripts/clarity-insights.mjs 1          # last 1 day
//   CLARITY_DIM=Device node scripts/clarity-insights.mjs   # break down by Device
//   CLARITY_JSON=1 node scripts/clarity-insights.mjs       # raw JSON

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const DEV_VARS = join(HERE, '..', '.dev.vars')
const API = 'https://www.clarity.ms/export-data/api/v1/project-live-insights'

// Behavioural metrics worth surfacing first — these are the friction signals.
const FRICTION = new Set([
  'RageClickCount', 'DeadClickCount', 'QuickbackClick', 'ExcessiveScroll',
  'ScriptErrorCount', 'ErrorClickCount',
])

function loadToken() {
  let txt
  try {
    txt = readFileSync(DEV_VARS, 'utf8')
  } catch {
    throw new Error(`cannot read ${DEV_VARS}`)
  }
  const m = txt.match(/^CLARITY_API_TOKEN=(.*)$/m)
  if (!m || !m[1].trim()) {
    throw new Error('CLARITY_API_TOKEN not set in .dev.vars — add it (Clarity → Settings → Data Export).')
  }
  return m[1].trim().replace(/^"(.*)"$/, '$1')
}

async function fetchInsights(token, numOfDays, dimension) {
  const url = new URL(API)
  url.searchParams.set('numOfDays', String(numOfDays))
  if (dimension) url.searchParams.set('dimension1', dimension)
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  const text = await res.text()
  if (!res.ok) throw new Error(`Clarity API ${res.status}: ${text.slice(0, 300)}`)
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`Clarity API returned non-JSON: ${text.slice(0, 200)}`)
  }
}

// The API returns [{ metricName, information: [{ <dimension>, sessionsCount, ... }] }].
// Shapes vary by metric, so print defensively.
function render(data, dimension) {
  if (!Array.isArray(data)) {
    console.log(JSON.stringify(data, null, 2))
    return
  }
  const byName = Object.fromEntries(data.map((m) => [m.metricName, m.information || []]))

  console.log('\n===== Traffic =====')
  for (const name of ['Traffic', 'PopularPages', 'ScrollDepth', 'EngagementTime']) {
    if (!byName[name]) continue
    console.log(`\n${name}:`)
    for (const row of byName[name].slice(0, 8)) console.log('  ' + JSON.stringify(row))
  }

  console.log('\n===== Friction signals (where users struggle) =====')
  let any = false
  for (const m of data) {
    if (!FRICTION.has(m.metricName)) continue
    any = true
    console.log(`\n${m.metricName}${dimension ? ` (by ${dimension})` : ''}:`)
    const rows = (m.information || [])
      .slice()
      .sort((a, b) => Number(b.subTotal || b.sessionsCount || 0) - Number(a.subTotal || a.sessionsCount || 0))
    for (const row of rows.slice(0, 10)) console.log('  ' + JSON.stringify(row))
  }
  if (!any) console.log('  (no friction metrics returned for this window)')

  const other = data.filter((m) => !FRICTION.has(m.metricName) &&
    !['Traffic', 'PopularPages', 'ScrollDepth', 'EngagementTime'].includes(m.metricName))
  if (other.length) console.log('\nOther metrics returned:', other.map((m) => m.metricName).join(', '))
}

async function main() {
  const token = loadToken()
  const numOfDays = Math.min(3, Math.max(1, Number(process.argv[2]) || 3))
  const dimension = process.env.CLARITY_DIM || 'URL'
  console.log(`Clarity live insights — last ${numOfDays} day(s), broken down by ${dimension}`)
  const data = await fetchInsights(token, numOfDays, dimension)
  if (process.env.CLARITY_JSON) {
    console.log(JSON.stringify(data, null, 2))
  } else {
    render(data, dimension)
  }
}

main().catch((e) => {
  console.error('\nERROR:', e.message)
  process.exit(1)
})
