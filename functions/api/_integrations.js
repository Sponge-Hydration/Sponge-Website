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

const DEFAULT_SITE = 'https://sponge-website.pages.dev'
const logoUrl = (order) => `${order.siteUrl || DEFAULT_SITE}/media/logo/full.png`

const money = (n, currency = 'usd') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(n || 0)

function firstName(order) {
  const full = (order.shipping && order.shipping.name) || ''
  const f = full.trim().split(/\s+/)[0]
  return f || 'there'
}

// Itemized order summary. Line-item descriptions already carry the color(s),
// e.g. "Sponge 2-Pack - Black, Pink" or "Sponge Hydration Tracker - Light Blue".
function itemsTable(order) {
  const rows = (order.items || [])
    .map(
      (i) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #eef1f4;">${i.description}</td>
        <td style="padding:10px 0;border-bottom:1px solid #eef1f4;text-align:center;color:#444;">${i.qty}</td>
        <td style="padding:10px 0;border-bottom:1px solid #eef1f4;text-align:right;white-space:nowrap;">${money(i.amount, order.currency)}</td>
      </tr>`
    )
    .join('')
  return `<table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px;margin:6px 0 4px;">
    <thead>
      <tr style="color:#8a95a1;font-size:11px;letter-spacing:.04em;text-transform:uppercase;">
        <th align="left" style="padding:0 0 6px;">Item</th>
        <th align="center" style="padding:0 0 6px;">Qty</th>
        <th align="right" style="padding:0 0 6px;">Price</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr><td style="padding:10px 0 0;color:#444;">Shipping</td><td></td><td style="padding:10px 0 0;text-align:right;color:#444;">${order.shippingCost ? money(order.shippingCost, order.currency) : 'Free'}</td></tr>
      <tr style="font-weight:700;font-size:15px;"><td style="padding:6px 0;">Total</td><td></td><td style="padding:6px 0;text-align:right;">${money(order.amount, order.currency)}</td></tr>
    </tfoot>
  </table>`
}

function shippingBlock(order) {
  const s = order.shipping
  if (!s?.address) return ''
  const a = s.address
  const cityLine = [`${a.city || ''}${a.city && a.state ? ',' : ''} ${a.state || ''} ${a.postal_code || ''}`.trim()]
  const lines = [s.name, a.line1, a.line2, ...cityLine, a.country].filter(Boolean).join('<br>')
  return `<h3 style="font-size:15px;margin:26px 0 6px;color:#111;">Shipping address</h3>
    <p style="font-size:14px;color:#444;margin:0;line-height:1.55;">${lines}</p>`
}

export function customerEmailHtml(order) {
  const orderNo = order.orderNumber || order.sessionId
  return `<div style="background:#f4f6f8;padding:24px 12px;font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e8edf2;border-radius:14px;overflow:hidden;">
      <div style="text-align:center;padding:28px 24px 12px;">
        <img src="${logoUrl(order)}" alt="Sponge Hydration" width="190" style="width:190px;max-width:70%;height:auto;" />
      </div>
      <div style="padding:8px 32px 32px;color:#111;line-height:1.55;">
        <p style="font-size:15px;margin:0 0 14px;">Hi ${firstName(order)},</p>
        <p style="font-size:15px;color:#444;margin:0 0 8px;">Thank you for ordering from Sponge Hydration, we have received your order. Please expect a tracking number as soon as your order ships out.</p>
        ${
          order.statusUrl
            ? `<div style="text-align:center;margin:20px 0 4px;"><a href="${order.statusUrl}" style="display:inline-block;background:#0b6bcb;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 28px;border-radius:8px;">View your order status</a></div>`
            : ''
        }
        <h3 style="font-size:15px;margin:26px 0 4px;color:#111;">Order summary</h3>
        <p style="font-size:14px;color:#444;margin:0 0 8px;">Order number: <strong>${orderNo}</strong></p>
        ${itemsTable(order)}
        ${shippingBlock(order)}
        <p style="font-size:13px;color:#8a95a1;margin-top:26px;border-top:1px solid #eef1f4;padding-top:16px;">Questions about your order? Just reply to this email.</p>
      </div>
    </div>
  </div>`
}

export function teamEmailHtml(order) {
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif;max-width:600px;margin:auto;color:#111;">
    <h1 style="font-size:19px;">New order received - ${order.orderNumber || ''}</h1>
    <p style="font-size:15px;color:#444;"><strong>${order.email || 'unknown'}</strong> · ${money(
      order.amount,
      order.currency
    )}</p>
    ${itemsTable(order)}
    ${shippingBlock(order)}
    <p style="font-size:13px;color:#888;margin-top:24px;">Order ${order.orderNumber || ''} · Session: ${order.sessionId} · Status: ${order.paymentStatus}</p>
  </div>`
}
