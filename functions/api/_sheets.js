// Google Sheets append via a service account — no Apps Script deploy needed.
// Signs a JWT with the service account private key (Web Crypto / RSASSA-PKCS1
// SHA-256), exchanges it for an access token, and appends the order row.
//
// Env vars:
//   GOOGLE_SA_EMAIL        — service account client_email
//   GOOGLE_SA_PRIVATE_KEY  — service account private_key (PEM; \n escapes OK)
//   GOOGLE_SHEET_ID        — the spreadsheet ID (from its URL)
//   SHEET_TAB_NAME         — tab to write to (default "2026")

const SCOPE = 'https://www.googleapis.com/auth/spreadsheets'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const DEFAULT_TAB = '2026'

// "2026" layout (25 columns) with a dedicated column per clip color. Delivery
// Date is column X (24); Days Since Delivered is column Y (25).
const HEADERS = [
  'Order Number', 'Order Date', 'First_Name', 'Name', 'Customer Email',
  'Address', 'City', 'State', 'Zip', 'Country',
  'Clip Black Qty', 'Clip White Qty', 'Clip Light Blue Qty', 'Clip Dark Blue Qty', 'Clip Light Gray Qty', 'Clip Pink Qty',
  'Coaster Black Qty', 'Coaster White Qty', 'Magnetic Adhesive 3-Pack Qty',
  'Items Summary', 'Status', 'Shipping_Cost', 'Tracking_Number', 'Delivery Date',
  'Days Since Delivered',
]
const DELIVERY_COL = 'X'

export function sheetsConfigured(env) {
  return Boolean(env.GOOGLE_SA_EMAIL && env.GOOGLE_SA_PRIVATE_KEY && env.GOOGLE_SHEET_ID)
}

// --- crypto / auth --------------------------------------------------------

function b64urlBytes(bytes) {
  let s = ''
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
const b64urlStr = (str) => b64urlBytes(new TextEncoder().encode(str))

function pemToArrayBuffer(pem) {
  const body = pem
    .replace(/\\n/g, '\n') // env vars often store the key with literal \n
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
    JSON.stringify({
      iss: env.GOOGLE_SA_EMAIL,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    })
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
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  if (!res.ok) throw new Error(`Google token error ${res.status}: ${await res.text()}`)
  return (await res.json()).access_token
}

// --- sheet helpers --------------------------------------------------------

async function ensureTab(env, token, tab) {
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEET_ID}?fields=sheets.properties.title`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!metaRes.ok) throw new Error(`Sheets meta error ${metaRes.status}: ${await metaRes.text()}`)
  const meta = await metaRes.json()
  const exists = (meta.sheets || []).some((s) => s.properties?.title === tab)
  if (exists) return

  // Create the tab, then write the header row.
  const addRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEET_ID}:batchUpdate`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ requests: [{ addSheet: { properties: { title: tab } } }] }),
    }
  )
  if (!addRes.ok) throw new Error(`Add tab error ${addRes.status}: ${await addRes.text()}`)

  await appendValues(env, token, tab, [HEADERS])
}

async function appendValues(env, token, tab, values) {
  const range = encodeURIComponent(`${tab}!A1`)
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEET_ID}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ values }),
    }
  )
  if (!res.ok) throw new Error(`Sheets append error ${res.status}: ${await res.text()}`)
  return res.json()
}

// Next sequential Order Number: max integer in column A + 1 (ignores rows like
// "added P2"). Low-volume webhook, so the read-then-append race is negligible.
async function getNextOrderNumber(env, token, tab) {
  const range = encodeURIComponent(`${tab}!A2:A`)
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEET_ID}/values/${range}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) return '' // leave blank rather than fail the whole append
  const data = await res.json()
  const nums = (data.values || []).map((r) => parseInt(r[0], 10)).filter((n) => Number.isFinite(n))
  return nums.length ? Math.max(...nums) + 1 : 1
}

function orderToRow(o, orderNumber) {
  const clips = o.clips || {}
  const a = (o.shipping && o.shipping.address) || {}
  const fullName = (o.shipping && o.shipping.name) || ''
  const sp = fullName.indexOf(' ')
  const firstName = sp === -1 ? fullName : fullName.slice(0, sp)
  const items = (o.items || []).map((i) => `${i.qty}x ${i.description}`).join('; ')
  const d = new Date()
  const orderDate = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`
  // Self-referencing formula so it works regardless of the appended row number.
  const daysSince = `=IF(INDIRECT("${DELIVERY_COL}"&ROW())="","",DAYS(TODAY(),INDIRECT("${DELIVERY_COL}"&ROW())))`

  return [
    orderNumber, orderDate, firstName, fullName, o.email || '',
    a.line1 || '', a.city || '', a.state || '', a.postal_code || '', a.country || '',
    clips.black || 0, clips.white || 0, clips.lightBlue || 0, clips.darkBlue || 0, clips.lightGray || 0, clips.pink || 0,
    '', '', '', // Coaster Black/White, Magnetic Adhesive (discontinued)
    items, 'New', '', '', '', // Items Summary, Status, Shipping_Cost, Tracking_Number, Delivery Date
    daysSince,
  ]
}

// Next sequential order number (self-contained; used by the webhook so the
// same number can go on both the sheet row and the confirmation email).
export async function nextOrderNumber(env) {
  const tab = env.SHEET_TAB_NAME || DEFAULT_TAB
  const token = await getAccessToken(env)
  return getNextOrderNumber(env, token, tab)
}

export async function appendOrderToSheet(env, order) {
  const tab = env.SHEET_TAB_NAME || DEFAULT_TAB
  const token = await getAccessToken(env)
  await ensureTab(env, token, tab)
  // Reuse the number the webhook already computed (keeps sheet + email in sync);
  // fall back to computing it here if not provided.
  const orderNumber =
    order.orderNumber != null && order.orderNumber !== ''
      ? order.orderNumber
      : await getNextOrderNumber(env, token, tab)
  return appendValues(env, token, tab, [orderToRow(order, orderNumber)])
}
