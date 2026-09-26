// Abandoned-checkout recovery: when a Stripe Checkout session expires unpaid
// (24h after it was opened), email the shopper a one-time 10% code and a link
// that reopens Checkout with the same cart.
//
// Rules (Stripe requires the first one for recovery emails):
//  - only shoppers who ticked Stripe's "email me offers" box
//    (session.consent.promotions === 'opt_in'); Stripe only includes the email
//    on an expired session in that case anyway;
//  - at most one recovery email per address per 30 days, and never twice for
//    the same session (Stripe retries webhooks);
//  - skip anyone who has since completed a purchase.
// Every send is logged to the "Cart Recovery" tab of the order sheet.
//
// Env: STRIPE_SECRET_KEY, GMAIL_* (sendGmail), GOOGLE_SA_* + GOOGLE_SHEET_ID,
//      RECOVERY_COUPON_ID (optional; defaults to SIGNUP_COUPON_ID, 10% once),
//      RECOVERY_CODE_DAYS (optional; default 7),
//      BUSINESS_POSTAL_ADDRESS (optional; shown in the email footer),
//      SITE_URL (optional)

import { createGiftCode } from './_gift.js'
import { gmailConfigured, sendGmail } from './_integrations.js'
import { getGoogleAccessToken, serviceAccountConfigured } from './_google-sa.js'

export const RECOVERY_TAB = 'Cart Recovery'
const HEADERS = ['Sent At (UTC)', 'Email', 'Expired Session', 'Code', 'Cart Value', 'Recovery Link Expires']
const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets'
const COOLDOWN_DAYS = 30

export function recoveryCoupon(env) {
  return env.RECOVERY_COUPON_ID || env.SIGNUP_COUPON_ID || ''
}

// Pure decision: should this expired session get an email? Returns a reason
// string when it should be skipped, or null when it should be sent.
export function skipReason(session, { log = [], now = Date.now() } = {}) {
  const email = session?.customer_details?.email
  const url = session?.after_expiration?.recovery?.url
  if (session?.status && session.status !== 'expired') return 'session not expired'
  if (session?.consent?.promotions !== 'opt_in') return 'no promotional consent'
  if (!email) return 'no email on session'
  if (!url) return 'recovery not enabled on session'
  const cutoff = now - COOLDOWN_DAYS * 86400 * 1000
  for (const row of log) {
    if (row.session === session.id) return 'already emailed for this session'
    if (row.email === email.toLowerCase() && Date.parse(row.sentAt) >= cutoff) return `already emailed this address in the last ${COOLDOWN_DAYS} days`
  }
  return null
}

// --- sheet log -------------------------------------------------------------

async function sheetFetch(env, token, path, init = {}) {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEET_ID}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json', ...(init.headers || {}) },
  })
  return res
}

async function readLog(env, token) {
  const res = await sheetFetch(env, token, `/values/${encodeURIComponent(`'${RECOVERY_TAB}'!A2:C`)}`)
  if (res.status === 400) return [] // tab not created yet
  if (!res.ok) throw new Error(`Sheets read ${res.status}: ${(await res.text()).slice(0, 200)}`)
  return ((await res.json()).values || []).map(([sentAt, email, session]) => ({
    sentAt,
    email: String(email || '').toLowerCase(),
    session,
  }))
}

async function appendLog(env, token, row) {
  const meta = await sheetFetch(env, token, '?fields=sheets.properties.title')
  if (meta.ok) {
    const j = await meta.json()
    if (!(j.sheets || []).some((s) => s.properties?.title === RECOVERY_TAB)) {
      await sheetFetch(env, token, ':batchUpdate', {
        method: 'POST',
        body: JSON.stringify({ requests: [{ addSheet: { properties: { title: RECOVERY_TAB } } }] }),
      })
      await appendRows(env, token, [HEADERS])
    }
  }
  await appendRows(env, token, [row])
}

async function appendRows(env, token, values) {
  const range = encodeURIComponent(`'${RECOVERY_TAB}'!A1`)
  const res = await sheetFetch(env, token, `/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
    method: 'POST',
    body: JSON.stringify({ values }),
  })
  if (!res.ok) throw new Error(`Sheets append ${res.status}: ${(await res.text()).slice(0, 200)}`)
}

// --- Stripe lookups ----------------------------------------------------------

async function stripeGet(env, path) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
  })
  if (!res.ok) throw new Error(`Stripe ${path.split('?')[0]} ${res.status}`)
  return res.json()
}

async function hasPurchasedSince(env, email, sinceSeconds) {
  const qs = new URLSearchParams({ 'customer_details[email]': email, status: 'complete', 'created[gte]': String(sinceSeconds), limit: '5' })
  const j = await stripeGet(env, `checkout/sessions?${qs}`)
  return (j.data || []).some((s) => s.payment_status === 'paid' || s.payment_status === 'no_payment_required')
}

async function cartItems(env, sessionId) {
  try {
    const j = await stripeGet(env, `checkout/sessions/${sessionId}/line_items?limit=20`)
    return (j.data || []).map((li) => ({ description: li.description, qty: li.quantity }))
  } catch {
    return []
  }
}

// --- email -------------------------------------------------------------------

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

export function recoveryEmailHtml({ code, url, items = [], days, siteUrl = 'https://www.spongehydration.com', postalAddress = '' }) {
  const list = items.length
    ? `<table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px;margin:4px 0 18px;text-align:left;">${items
        .map((i) => `<tr><td style="padding:8px 0;border-bottom:1px solid #eef1f4;color:#111;">${esc(i.description)}</td><td style="padding:8px 0;border-bottom:1px solid #eef1f4;text-align:right;color:#444;">x${esc(i.qty)}</td></tr>`)
        .join('')}</table>`
    : ''
  return `<div style="background:#f4f6f8;padding:24px 12px;font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e8edf2;border-radius:14px;overflow:hidden;">
      <div style="text-align:center;padding:28px 24px 12px;">
        <img src="${siteUrl}/media/logo/full.png" alt="Sponge Hydration" width="190" style="width:190px;max-width:70%;height:auto;" />
      </div>
      <div style="padding:8px 32px 32px;color:#111;line-height:1.55;text-align:center;">
        <h2 style="font-size:22px;margin:6px 0 8px;color:#111;">You left something in your cart</h2>
        <p style="font-size:15px;color:#444;margin:0 0 16px;">Your Sponge is still waiting. Finish your order in the next ${days} days and take 10% off.</p>
        ${list}
        <p style="font-size:14px;color:#444;margin:0 0 10px;">Your personal code:</p>
        <div style="display:inline-block;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:24px;font-weight:700;letter-spacing:.08em;background:#f0f7ff;border:2px dashed #0b6bcb;color:#0b6bcb;border-radius:10px;padding:14px 22px;">${esc(code)}</div>
        <p style="font-size:14px;color:#444;margin:18px 0 0;">The button below reopens checkout with your cart. Enter the code in the <strong>promotion code</strong> field.</p>
        <div style="margin:22px 0 4px;"><a href="${esc(url)}" style="display:inline-block;background:#0b6bcb;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 28px;border-radius:8px;">Finish my order</a></div>
        <p style="font-size:12px;color:#8a95a1;margin-top:26px;border-top:1px solid #eef1f4;padding-top:16px;">This code works once, on one order, for ${days} days. You are getting this email because you agreed to hear from Sponge Hydration at checkout. To stop these emails, reply with "unsubscribe".${postalAddress ? `<br>Sponge Hydration, LLC · ${esc(postalAddress)}` : ''}</p>
      </div>
    </div>
  </div>`
}

// --- main ---------------------------------------------------------------------

export async function handleCheckoutExpired(session, env) {
  if (!env.STRIPE_SECRET_KEY || !recoveryCoupon(env)) return { skipped: 'recovery not configured (Stripe key or coupon missing)' }
  if (!gmailConfigured(env)) return { skipped: 'Gmail not configured' }
  const canLog = serviceAccountConfigured(env) && Boolean(env.GOOGLE_SHEET_ID)

  let token = null
  let log = []
  if (canLog) {
    token = await getGoogleAccessToken(env, SHEETS_SCOPE)
    log = await readLog(env, token)
  }
  const reason = skipReason(session, { log })
  if (reason) return { skipped: reason }

  const email = session.customer_details.email
  if (await hasPurchasedSince(env, email, session.created || 0)) return { skipped: 'shopper has since completed a purchase' }

  const days = Math.max(1, parseInt(env.RECOVERY_CODE_DAYS, 10) || 7)
  const code = await createGiftCode(env, {
    email,
    coupon: recoveryCoupon(env),
    prefix: 'COMEBACK',
    source: 'cart-recovery',
    expiresAt: Math.floor(Date.now() / 1000) + days * 86400,
    metadata: { expired_session: session.id },
  })
  const items = await cartItems(env, session.id)
  const siteUrl = env.SITE_URL || 'https://www.spongehydration.com'
  await sendGmail(env, {
    to: email,
    subject: 'You left something in your cart (10% off inside)',
    html: recoveryEmailHtml({
      code,
      url: session.after_expiration.recovery.url,
      items,
      days,
      siteUrl,
      postalAddress: env.BUSINESS_POSTAL_ADDRESS || '',
    }),
  })
  if (canLog) {
    const exp = session.after_expiration.recovery.expires_at
    await appendLog(env, token, [
      new Date().toISOString(),
      email.toLowerCase(),
      session.id,
      code,
      ((session.amount_total || 0) / 100).toFixed(2),
      exp ? new Date(exp * 1000).toISOString() : '',
    ])
  }
  return { sent: true, code }
}
