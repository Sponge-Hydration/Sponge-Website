// Cloudflare Pages Function: POST /api/webhook
//
// Receives Stripe webhook events, verifies the signature, and acts on
// `checkout.session.completed` — the reliable signal that a payment cleared.
//
// Signature verification uses Web Crypto (SubtleCrypto), so it runs on the
// Cloudflare/Workers runtime without the Node Stripe SDK.
//
// Env vars:
//   STRIPE_WEBHOOK_SECRET — the signing secret (whsec_...). Locally this comes
//     from `stripe listen`; in production from the Stripe Dashboard webhook.
//   STRIPE_SECRET_KEY — used to fetch the order's line items for fulfillment.

import { gmailConfigured, sendGmail, customerEmailHtml, teamEmailHtml } from './_integrations.js'
import { sheetsConfigured, appendOrderToSheet, nextOrderNumber } from './_sheets.js'

const TOLERANCE_SECONDS = 300 // reject events older than 5 minutes (replay guard)

const enc = new TextEncoder()

async function hmacHex(secret, payload) {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Constant-time string comparison to avoid timing leaks.
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false
  let out = 0
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return out === 0
}

// Verify a Stripe-Signature header of the form: t=<ts>,v1=<sig>[,v1=<sig>...]
async function verifyStripeSignature(payload, header, secret) {
  if (!header) return false
  let timestamp = ''
  const v1 = []
  for (const part of header.split(',')) {
    const [key, value] = part.split('=')
    if (key === 't') timestamp = value
    else if (key === 'v1') v1.push(value)
  }
  if (!timestamp || v1.length === 0) return false

  const age = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10)
  if (!Number.isFinite(age) || Math.abs(age) > TOLERANCE_SECONDS) return false

  const expected = await hmacHex(secret, `${timestamp}.${payload}`)
  return v1.some((sig) => timingSafeEqual(sig, expected))
}

async function handleCheckoutCompleted(session, env) {
  // The session object omits line items; fetch them for fulfillment details.
  let items = []
  if (env.STRIPE_SECRET_KEY) {
    const res = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${session.id}/line_items?limit=100`,
      { headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` } }
    )
    if (res.ok) {
      const data = await res.json()
      items = (data.data || []).map((li) => ({
        description: li.description,
        qty: li.quantity,
        amount: (li.amount_total || 0) / 100,
      }))
    }
  }

  const m = session.metadata || {}
  const num = (v) => parseInt(v, 10) || 0
  const order = {
    sessionId: session.id,
    paymentStatus: session.payment_status,
    email: session.customer_details?.email || null,
    amount: (session.amount_total || 0) / 100,
    currency: session.currency,
    shipping: session.shipping_details || session.collected_information?.shipping_details || null,
    items,
    // Structured counts from checkout metadata (for the order sheet columns).
    clips: {
      lightBlue: num(m.clips_light_blue),
      darkBlue: num(m.clips_dark_blue),
      black: num(m.clips_black),
      white: num(m.clips_white),
      lightGray: num(m.clips_light_gray),
      pink: num(m.clips_pink),
    },
    packs: {
      single: num(m.qty_single),
      twoPack: num(m.qty_2pack),
      family: num(m.qty_family),
    },
  }

  // Assign the order number once so the sheet row and confirmation email match.
  let orderNumber = ''
  try {
    if (sheetsConfigured(env)) orderNumber = String(await nextOrderNumber(env))
  } catch (e) {
    console.warn('order number lookup failed:', e?.message || e)
  }
  if (!orderNumber) orderNumber = `SPNG-${session.id.slice(-6).toUpperCase()}`
  order.orderNumber = orderNumber

  console.log('✅ Order paid:', JSON.stringify(order))

  // Fire the three side effects independently — a failure in one must not
  // block the others, and must not make Stripe retry the whole delivery.
  const team = env.TEAM_EMAIL || 'team@spongehydration.com'
  const tasks = {
    sheet: sheetsConfigured(env)
      ? appendOrderToSheet(env, order)
      : Promise.reject(new Error('Google Sheets service account not configured')),
    customerEmail:
      gmailConfigured(env) && order.email
        ? sendGmail(env, {
            to: order.email,
            subject: `Sponge Hydration Order Confirmed - Order Number: ${order.orderNumber}`,
            html: customerEmailHtml(order),
          })
        : Promise.reject(new Error('Gmail not configured or no customer email')),
    teamEmail: gmailConfigured(env)
      ? sendGmail(env, {
          to: team,
          subject: `New order — ${money(order.amount, order.currency)} (${order.email || 'unknown'})`,
          html: teamEmailHtml(order),
        })
      : Promise.reject(new Error('Gmail not configured')),
  }

  const entries = Object.entries(tasks)
  const results = await Promise.allSettled(entries.map(([, p]) => p))
  results.forEach((r, i) => {
    const name = entries[i][0]
    if (r.status === 'fulfilled') console.log(`   ↳ ${name}: ok`)
    else console.warn(`   ↳ ${name}: FAILED — ${r.reason?.message || r.reason}`)
  })
}

const money = (n, currency = 'usd') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(n || 0)

export async function onRequestPost({ request, env }) {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return new Response('Webhook secret not configured.', { status: 500 })
  }

  const payload = await request.text()
  const signature = request.headers.get('stripe-signature')

  const valid = await verifyStripeSignature(payload, signature, env.STRIPE_WEBHOOK_SECRET)
  if (!valid) {
    return new Response('Invalid signature.', { status: 400 })
  }

  let event
  try {
    event = JSON.parse(payload)
  } catch {
    return new Response('Invalid JSON.', { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object, env)
      break
    default:
      // Other event types are acknowledged but not acted on.
      break
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}
