// Abandoned-cart log: every Stripe Checkout session that expires unpaid gets a
// row in the "Abandoned Carts" tab of the order sheet, whether or not a
// recovery email went out (that is logged separately in "Cart Recovery").
//
// One row per session (Stripe retries webhooks, so the session id is checked
// before appending). The email is only present when the shopper ticked
// "email me offers"; Stripe withholds it otherwise.
//
// Env: GOOGLE_SA_EMAIL / GOOGLE_SA_PRIVATE_KEY / GOOGLE_SHEET_ID (same as the
// order sheet).

import { getGoogleAccessToken, serviceAccountConfigured } from './_google-sa.js'

export const ABANDONED_TAB = 'Abandoned Carts'
export const ABANDONED_HEADERS = [
  'Expired At (UTC)', 'Opened At (UTC)', 'Session', 'Email', 'Offers Opt-in',
  'Items', 'Cart Value', 'Recovery Email', 'Internal',
]
const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets'

const SKU_LABELS = [
  ['qty_single', 'Sponge Tracker'],
  ['qty_family', 'Family Pack'],
  ['qty_adhesive_3pack', 'Adhesive 3-Pack'],
  ['qty_dot', 'Sponge Dot'],
  ['qty_2pack', '2-Pack'],
]
const CLIP_COLORS = [
  ['clips_black', 'black'], ['clips_white', 'white'], ['clips_light_blue', 'light blue'],
  ['clips_dark_blue', 'dark blue'], ['clips_light_gray', 'light gray'], ['clips_pink', 'pink'],
]

const num = (v) => Number.parseInt(v, 10) || 0
const iso = (s) => (s ? new Date(s * 1000).toISOString().slice(0, 16).replace('T', ' ') : '')

/** "Sponge Tracker x2, Adhesive 3-Pack x1 (clips: black 1, white 1)" from session metadata. */
export function itemsSummary(metadata = {}) {
  const parts = SKU_LABELS.filter(([k]) => num(metadata[k]) > 0).map(([k, label]) => `${label} x${num(metadata[k])}`)
  const colors = CLIP_COLORS.filter(([k]) => num(metadata[k]) > 0).map(([k, c]) => `${c} ${num(metadata[k])}`)
  const base = parts.join(', ') || 'unknown'
  return colors.length ? `${base} (clips: ${colors.join(', ')})` : base
}

/** Human-readable outcome of the recovery attempt for the log. */
export function recoveryLabel(recovery) {
  if (!recovery) return ''
  if (recovery.error) return `Error: ${recovery.error}`
  if (recovery.skipped) return `Not sent: ${recovery.skipped}`
  return 'Sent'
}

/** The sheet row for one expired session. */
export function abandonedRow(session, recovery) {
  const m = session.metadata || {}
  return [
    iso(session.expires_at) || new Date().toISOString().slice(0, 16).replace('T', ' '),
    iso(session.created),
    session.id,
    session.customer_details?.email || '',
    session.consent?.promotions === 'opt_in' ? 'yes' : 'no',
    itemsSummary(m),
    ((session.amount_total || 0) / 100).toFixed(2),
    recoveryLabel(recovery),
    m.internal === '1' ? 'yes' : '',
  ]
}

const sheetFetch = (env, token, path, init = {}) =>
  fetch(`https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEET_ID}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json', ...(init.headers || {}) },
  })

async function append(env, token, values) {
  const range = encodeURIComponent(`'${ABANDONED_TAB}'!A1`)
  const res = await sheetFetch(env, token, `/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
    method: 'POST',
    body: JSON.stringify({ values }),
  })
  if (!res.ok) throw new Error(`Sheets append ${res.status}: ${(await res.text()).slice(0, 200)}`)
}

/**
 * Appends one row for an expired session. Returns { logged: true } or
 * { skipped: reason }. Creates the tab (with headers) on first use.
 */
export async function logAbandonedCart(session, env, recovery) {
  if (!serviceAccountConfigured(env) || !env.GOOGLE_SHEET_ID) return { skipped: 'sheet not configured' }
  const token = await getGoogleAccessToken(env, SHEETS_SCOPE)

  const existing = await sheetFetch(env, token, `/values/${encodeURIComponent(`'${ABANDONED_TAB}'!C2:C`)}`)
  if (existing.status === 400) {
    // Tab does not exist yet: create it and write the header row.
    const add = await sheetFetch(env, token, ':batchUpdate', {
      method: 'POST',
      body: JSON.stringify({ requests: [{ addSheet: { properties: { title: ABANDONED_TAB } } }] }),
    })
    if (!add.ok) throw new Error(`Sheets addSheet ${add.status}: ${(await add.text()).slice(0, 200)}`)
    await append(env, token, [ABANDONED_HEADERS])
  } else if (existing.ok) {
    const ids = ((await existing.json()).values || []).map((r) => r[0])
    if (ids.includes(session.id)) return { skipped: 'already logged' }
  } else {
    throw new Error(`Sheets read ${existing.status}`)
  }

  await append(env, token, [abandonedRow(session, recovery)])
  return { logged: true }
}
