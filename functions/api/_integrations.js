// Shared integrations for the order webhook: Gmail API sending + Google Sheet
// append. Underscore-prefixed files are NOT routed by Cloudflare Pages, so this
// is a plain importable module.

const DEFAULT_FROM = 'team@spongehydration.com'
const DEFAULT_TEAM = 'team@spongehydration.com'

export function gmailConfigured(env) {
  return Boolean(env.GMAIL_CLIENT_ID && env.GMAIL_CLIENT_SECRET && env.GMAIL_REFRESH_TOKEN)
}

// --- Gmail ---------------------------------------------------------------

async function getGmailAccessToken(env) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GMAIL_CLIENT_ID,
      client_secret: env.GMAIL_CLIENT_SECRET,
      refresh_token: env.GMAIL_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) throw new Error(`Gmail token error ${res.status}: ${await res.text()}`)
  return (await res.json()).access_token
}

// base64url-encode a UTF-8 string (Gmail expects RFC 2822 in raw base64url).
export function b64url(str) {
  const bytes = new TextEncoder().encode(str)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function buildMime({ from, to, subject, html }) {
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset="UTF-8"',
  ]
  return `${headers.join('\r\n')}\r\n\r\n${html}`
}

export async function sendGmail(env, { to, subject, html }) {
  const from = env.ORDER_FROM_EMAIL || DEFAULT_FROM
  const token = await getGmailAccessToken(env)
  const raw = b64url(buildMime({ from, to, subject, html }))
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ raw }),
  })
  if (!res.ok) throw new Error(`Gmail send error ${res.status}: ${await res.text()}`)
  return res.json()
}

// --- Google Sheet (via Apps Script web app) ------------------------------

export async function appendToSheet(env, order) {
  const res = await fetch(env.GOOGLE_SHEET_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    // The Apps Script checks `secret` before appending.
    body: JSON.stringify({ secret: env.SHEET_SHARED_SECRET || '', order }),
  })
  if (!res.ok) throw new Error(`Sheet append error ${res.status}: ${await res.text()}`)
  return res.text()
}

// --- Email templates -----------------------------------------------------

const money = (n, currency = 'usd') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(n)

function itemsTable(order) {
  const rows = (order.items || [])
    .map(
      (i) =>
        `<tr><td style="padding:6px 0;">${i.qty} × ${i.description}</td><td style="padding:6px 0;text-align:right;">${money(
          i.amount,
          order.currency
        )}</td></tr>`
    )
    .join('')
  return `<table style="width:100%;border-collapse:collapse;font-size:15px;">${rows}
    <tr><td style="padding-top:10px;border-top:1px solid #eee;font-weight:700;">Total</td>
    <td style="padding-top:10px;border-top:1px solid #eee;text-align:right;font-weight:700;">${money(
      order.amount,
      order.currency
    )}</td></tr></table>`
}

function shippingBlock(order) {
  const s = order.shipping
  if (!s?.address) return ''
  const a = s.address
  const lines = [s.name, a.line1, a.line2, `${a.city || ''} ${a.state || ''} ${a.postal_code || ''}`, a.country]
    .filter(Boolean)
    .join('<br>')
  return `<p style="font-size:15px;color:#444;"><strong>Shipping to</strong><br>${lines}</p>`
}

function firstName(order) {
  const full = (order.shipping && order.shipping.name) || ''
  const f = full.trim().split(/\s+/)[0]
  return f || 'there'
}

export function customerEmailHtml(order) {
  const orderNo = order.orderNumber || order.sessionId
  return `<div style="font-family:system-ui,Arial,sans-serif;max-width:560px;margin:auto;color:#111;line-height:1.5;">
    <p style="font-size:15px;">Hi ${firstName(order)},</p>
    <p style="font-size:15px;color:#444;">Thank you for ordering from Sponge Hydration, we have received your order. Please expect a tracking number as soon as your order ships out.</p>
    <h3 style="font-size:16px;margin:24px 0 6px;">Order summary</h3>
    <p style="font-size:14px;color:#444;margin:0 0 10px;">Order number: <strong>${orderNo}</strong></p>
    ${itemsTable(order)}
    ${shippingBlock(order)}
    <p style="font-size:13px;color:#888;margin-top:24px;">Questions? Just reply to this email.</p>
  </div>`
}

export function teamEmailHtml(order) {
  return `<div style="font-family:system-ui,Arial,sans-serif;max-width:560px;margin:auto;color:#111;">
    <h1 style="font-size:20px;">New order received — ${order.orderNumber || ''}</h1>
    <p style="font-size:15px;color:#444;"><strong>${order.email || 'unknown'}</strong> · ${money(
      order.amount,
      order.currency
    )}</p>
    ${itemsTable(order)}
    ${shippingBlock(order)}
    <p style="font-size:13px;color:#888;margin-top:24px;">Order ${order.orderNumber || ''} · Session: ${order.sessionId} · Status: ${order.paymentStatus}</p>
  </div>`
}
