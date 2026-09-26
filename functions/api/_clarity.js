// Microsoft Clarity helpers shared by clarity-snapshot.js and
// weekly-site-report.js.
//
// The Clarity Data Export API only returns the last 1–3 days and allows ~10
// calls per project per day, so a weekly view needs daily snapshots. Those are
// stored as rows in a tab of the order-log spreadsheet (GOOGLE_SHEET_ID), one
// row per (day, dimension), holding a trimmed JSON copy of the API response.
//
// Env: CLARITY_API_TOKEN (Clarity → Settings → Data Export),
//      GOOGLE_SA_EMAIL / GOOGLE_SA_PRIVATE_KEY / GOOGLE_SHEET_ID,
//      CLARITY_SHEET_TAB (optional, default "Clarity Daily")

import { getGoogleAccessToken } from './_google-sa.js'

const API = 'https://www.clarity.ms/export-data/api/v1/project-live-insights'
const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets'
export const DEFAULT_CLARITY_TAB = 'Clarity Daily'
export const SNAPSHOT_HEADERS = ['Date (PT)', 'Taken At (UTC)', 'Dimension', 'Days Covered', 'Data (JSON)']
const MAX_CELL = 49000 // Sheets hard limit is 50,000 chars per cell

export const FRICTION_METRICS = [
  'RageClickCount', 'DeadClickCount', 'QuickbackClick', 'ExcessiveScroll',
  'ScriptErrorCount', 'ErrorClickCount',
]

export async function fetchClarity(token, numOfDays, dimension) {
  const url = new URL(API)
  url.searchParams.set('numOfDays', String(numOfDays))
  if (dimension) url.searchParams.set('dimension1', dimension)
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  const text = await res.text()
  if (!res.ok) throw new Error(`Clarity API ${res.status}: ${text.slice(0, 300)}`)
  return JSON.parse(text)
}

const num = (v) => {
  if (typeof v === 'number') return v
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v)
  return null
}
const weight = (row) => num(row.sessionsCount) || num(row.totalSessionCount) || 1

// Clarity URLs carry query strings (utm_*, fbclid…) and the full origin.
// Collapse them to a path so the same page from different campaigns groups.
export function normalizeUrl(u) {
  if (typeof u !== 'string') return u
  try {
    const p = new URL(u, 'https://www.spongehydration.com')
    return p.pathname.replace(/\/+$/, '') || '/'
  } catch {
    return u.split(/[?#]/)[0]
  }
}

// Keep the biggest rows per metric so a snapshot fits in one sheet cell.
export function trimSnapshot(data, maxRows = 30) {
  if (!Array.isArray(data)) return data
  for (const limit of [maxRows, 15, 8, 3]) {
    const trimmed = data.map((m) => ({
      metricName: m.metricName,
      information: (m.information || [])
        .slice()
        .sort((a, b) => weight(b) - weight(a))
        .slice(0, limit),
    }))
    if (JSON.stringify(trimmed).length <= MAX_CELL) return trimmed
  }
  return data.map((m) => ({ metricName: m.metricName, information: [] }))
}

// Merge several daily snapshots (same dimension) into one weekly view.
// Counts are summed; percentages / averages / durations are weighted by
// session count. Returns { metricName: [rows sorted by sessions desc] }.
export function aggregateSnapshots(snapshots, dimension) {
  const out = {}
  for (const snap of snapshots) {
    if (!Array.isArray(snap)) continue
    for (const m of snap) {
      const bucket = (out[m.metricName] ||= new Map())
      for (const row of m.information || []) {
        let key = dimension ? row[dimension] : '__all__'
        if (dimension === 'URL') key = normalizeUrl(key)
        key = key ?? '(unknown)'
        const acc = bucket.get(key) || { _w: 0, _avg: {}, _sum: {}, days: 0 }
        const w = weight(row)
        acc._w += w
        acc.days += 1
        for (const [k, v] of Object.entries(row)) {
          if (k === dimension) continue
          const n = num(v)
          if (n == null) continue
          if (/percent|average|avg|rate|time|depth/i.test(k)) {
            acc._avg[k] = (acc._avg[k] || 0) + n * w
          } else {
            acc._sum[k] = (acc._sum[k] || 0) + n
          }
        }
        bucket.set(key, acc)
      }
    }
  }
  const result = {}
  for (const [metric, bucket] of Object.entries(out)) {
    result[metric] = [...bucket.entries()]
      .map(([key, acc]) => {
        const row = dimension ? { [dimension]: key } : {}
        for (const [k, v] of Object.entries(acc._sum)) row[k] = v
        for (const [k, v] of Object.entries(acc._avg)) row[k] = Math.round((v / acc._w) * 100) / 100
        row.daysWithData = acc.days
        return row
      })
      .sort((a, b) => (num(b.sessionsCount) || 0) - (num(a.sessionsCount) || 0))
      .slice(0, 15)
  }
  return result
}

// --- sheet storage --------------------------------------------------------

const tabName = (env) => env.CLARITY_SHEET_TAB || DEFAULT_CLARITY_TAB

async function sheetsToken(env) {
  return getGoogleAccessToken(env, SHEETS_SCOPE)
}

async function ensureTab(env, token, tab) {
  const base = `https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEET_ID}`
  const meta = await fetch(`${base}?fields=sheets.properties.title`, { headers: { Authorization: `Bearer ${token}` } })
  if (!meta.ok) throw new Error(`Sheets meta error ${meta.status}: ${(await meta.text()).slice(0, 300)}`)
  const j = await meta.json()
  if ((j.sheets || []).some((s) => s.properties?.title === tab)) return
  const add = await fetch(`${base}:batchUpdate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ requests: [{ addSheet: { properties: { title: tab } } }] }),
  })
  if (!add.ok) throw new Error(`Add tab error ${add.status}: ${(await add.text()).slice(0, 300)}`)
  await appendRows(env, token, tab, [SNAPSHOT_HEADERS])
}

async function appendRows(env, token, tab, values) {
  const range = encodeURIComponent(`'${tab}'!A1`)
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEET_ID}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ values }),
    }
  )
  if (!res.ok) throw new Error(`Sheets append error ${res.status}: ${(await res.text()).slice(0, 300)}`)
}

// rows: [{ date, dimension, days, data }]
export async function saveSnapshots(env, rows) {
  const token = await sheetsToken(env)
  const tab = tabName(env)
  await ensureTab(env, token, tab)
  const takenAt = new Date().toISOString()
  await appendRows(
    env,
    token,
    tab,
    rows.map((r) => [r.date, takenAt, r.dimension, r.days, JSON.stringify(trimSnapshot(r.data))])
  )
}

// Returns [{ date, takenAt, dimension, days, data }], latest snapshot per
// (date, dimension). Missing tab → [].
export async function loadSnapshots(env) {
  const token = await sheetsToken(env)
  const range = encodeURIComponent(`'${tabName(env)}'!A2:E`)
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEET_ID}/values/${range}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (res.status === 400) return [] // tab doesn't exist yet
  if (!res.ok) throw new Error(`Sheets read error ${res.status}: ${(await res.text()).slice(0, 300)}`)
  const j = await res.json()
  return latestPerDay(
    (j.values || []).map(([date, takenAt, dimension, days, data]) => {
      let parsed = null
      try { parsed = JSON.parse(data) } catch {}
      return { date, takenAt, dimension, days: Number(days) || 1, data: parsed }
    })
  )
}

export function latestPerDay(rows) {
  const best = new Map()
  for (const r of rows) {
    if (!r.date || !r.data) continue
    const k = `${r.date}|${r.dimension}`
    const prev = best.get(k)
    if (!prev || String(r.takenAt) > String(prev.takenAt)) best.set(k, r)
  }
  return [...best.values()]
}
