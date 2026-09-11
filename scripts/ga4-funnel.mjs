#!/usr/bin/env node
// GA4 e-commerce funnel puller for Sponge Hydration.
//
// Reuses the Google service account that the order-log uses (GOOGLE_SA_EMAIL /
// GOOGLE_SA_PRIVATE_KEY, read from .dev.vars at the repo root) with the
// analytics.readonly scope. Prints the view_item → add_to_cart →
// begin_checkout → purchase funnel with step-to-step conversion, filtered to
// the WEB stream so Android/iOS app events don't muddy the numbers.
//
// Setup (one-time):
//   • Analytics Data API + Admin API enabled in the SA's GCP project.
//   • SA granted Viewer on the GA4 property that owns measurement id
//     G-DGZGWC184G (property 437571529, under team@spongehydration.com).
//
// Usage:
//   node scripts/ga4-funnel.mjs                 # default property, 28 + 90 day
//   node scripts/ga4-funnel.mjs <propertyId>    # override property
//   GA4_JSON=1 node scripts/ga4-funnel.mjs      # emit machine-readable JSON
//
// No secrets live in this file — it only reads them from .dev.vars.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import crypto from 'node:crypto'

const HERE = dirname(fileURLToPath(import.meta.url))
const DEV_VARS = join(HERE, '..', '.dev.vars')
const SCOPE = 'https://www.googleapis.com/auth/analytics.readonly'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'

// Property 437571529 owns the web data stream with measurement id G-DGZGWC184G.
const DEFAULT_PROPERTY = process.env.GA4_PROPERTY_ID || '437571529'
// Funnel steps in order — GA4 event names our site fires.
const FUNNEL = ['session_start', 'view_item', 'add_to_cart', 'begin_checkout', 'purchase']

function loadEnv() {
  let txt
  try {
    txt = readFileSync(DEV_VARS, 'utf8')
  } catch {
    throw new Error(`cannot read ${DEV_VARS} — run from the repo with .dev.vars present`)
  }
  const env = {}
  for (const line of txt.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) env[m[1]] = m[2].replace(/^"(.*)"$/, '$1')
  }
  return env
}

const b64url = (input) =>
  Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

async function getToken(env) {
  const now = Math.floor(Date.now() / 1000)
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claim = b64url(
    JSON.stringify({ iss: env.GOOGLE_SA_EMAIL, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 })
  )
  const signingInput = `${header}.${claim}`
  const sig = crypto
    .createSign('RSA-SHA256')
    .update(signingInput)
    .sign(env.GOOGLE_SA_PRIVATE_KEY.replace(/\\n/g, '\n'))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${signingInput}.${sig}`,
    }),
  })
  const j = await res.json()
  if (!res.ok) throw new Error(`token exchange failed: ${res.status} ${JSON.stringify(j)}`)
  return j.access_token
}

// Web-only funnel: eventName in FUNNEL AND platform == web.
async function runFunnel(token, propertyId, startDate, endDate) {
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'totalUsers' }, { name: 'eventCount' }],
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
  for (const r of j.rows || []) {
    byEvent[r.dimensionValues[0].value] = {
      users: Number(r.metricValues[0].value),
      count: Number(r.metricValues[1].value),
    }
  }
  const top = byEvent[FUNNEL[0]]?.users || 0
  let prev = null
  const steps = FUNNEL.map((step) => {
    const d = byEvent[step] || { users: 0, count: 0 }
    const pctPrev = prev == null ? null : prev === 0 ? 0 : (d.users / prev) * 100
    const pctTop = top === 0 ? 0 : (d.users / top) * 100
    prev = d.users
    return { step, users: d.users, events: d.count, pctPrev, pctTop }
  })
  return { startDate, endDate, steps }
}

function renderText(label, report) {
  const lines = [`\n===== ${label} =====`, 'step                users   %prev   %ofTop   events']
  for (const s of report.steps) {
    const pctPrev = s.pctPrev == null ? '   —' : `${s.pctPrev.toFixed(1)}%`
    const pctTop = `${s.pctTop.toFixed(1)}%`
    lines.push(
      `${s.step.padEnd(18)} ${String(s.users).padStart(6)}  ${pctPrev.padStart(6)}  ${pctTop.padStart(6)}   ${String(s.events).padStart(6)}`
    )
  }
  return lines.join('\n')
}

export async function pullFunnel(propertyId = DEFAULT_PROPERTY) {
  const env = loadEnv()
  if (!env.GOOGLE_SA_EMAIL || !env.GOOGLE_SA_PRIVATE_KEY) throw new Error('missing SA creds in .dev.vars')
  const token = await getToken(env)
  const ranges = [
    ['Last 7 days', '7daysAgo'],
    ['Last 28 days', '28daysAgo'],
    ['Last 90 days', '90daysAgo'],
  ]
  const reports = {}
  for (const [label, start] of ranges) reports[label] = await runFunnel(token, propertyId, start, 'today')
  return { propertyId, reports }
}

// Run directly (not when imported).
if (import.meta.url === `file://${process.argv[1]}`) {
  const propertyId = process.argv[2] || DEFAULT_PROPERTY
  pullFunnel(propertyId)
    .then(({ reports }) => {
      if (process.env.GA4_JSON) {
        console.log(JSON.stringify(reports, null, 2))
      } else {
        console.log(`GA4 web funnel — property ${propertyId}`)
        for (const [label, rep] of Object.entries(reports)) console.log(renderText(label, rep))
      }
    })
    .catch((e) => {
      console.error('\nERROR:', e.message)
      process.exit(1)
    })
}
