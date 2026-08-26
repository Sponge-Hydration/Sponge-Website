// Meta Conversions API — server-side Purchase events.
//
// Why this exists alongside the browser pixel: ad blockers, Safari ITP and iOS
// App Tracking Transparency drop a large share of browser-side Purchase events,
// which starves Meta's optimiser of exactly the signal it needs. Sending the
// same event from the Stripe webhook is not affected by any of that, because it
// leaves our server after the payment has actually cleared.
//
// Deduplication: both copies carry `event_id` = the Stripe checkout session id.
// Meta collapses a browser event and a server event that share an event_id and
// event_name into a single conversion, so this never double-counts.
//
// Env vars (both required, both SECRET — set via the Cloudflare dashboard or
// `wrangler pages secret put`, never in git and never as a VITE_ var):
//   META_PIXEL_ID   - the numeric pixel/dataset id
//   META_CAPI_TOKEN - the Conversions API access token from Events Manager
// Optional:
//   META_TEST_EVENT_CODE - set temporarily to see events in the Test Events tab

const GRAPH_VERSION = 'v21.0'

export function metaCapiConfigured(env) {
  return Boolean(env.META_PIXEL_ID && env.META_CAPI_TOKEN)
}

const enc = new TextEncoder()

async function sha256(value) {
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(value))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Meta requires each identifier normalised a specific way before hashing, or
// the match simply fails. Returns undefined for empty input so the key is
// omitted rather than sent as a hash of "".
async function hashed(value, normalise = (v) => v.trim().toLowerCase()) {
  if (!value) return undefined
  const norm = normalise(String(value))
  if (!norm) return undefined
  return sha256(norm)
}

const onlyDigits = (v) => v.replace(/\D/g, '')
const stripPunctuation = (v) => v.trim().toLowerCase().replace(/[^a-z]/g, '')

async function buildUserData(order, request) {
  const addr = order.shipping?.address || {}
  const fullName = (order.shipping?.name || '').trim()
  const [firstName, ...rest] = fullName.split(/\s+/)
  const lastName = rest.join(' ')

  const data = {
    em: await hashed(order.email),
    ph: await hashed(order.phone, onlyDigits),
    fn: await hashed(firstName),
    ln: await hashed(lastName),
    ct: await hashed(addr.city, stripPunctuation),
    st: await hashed(addr.state, stripPunctuation),
    // US zips: Meta wants the 5-digit base, not ZIP+4.
    zp: await hashed(addr.postal_code, (v) => onlyDigits(v).slice(0, 5)),
    country: await hashed(addr.country),
  }

  // The browser event carries fbp/fbc cookies and the real client IP; this
  // server event can only pass through what Stripe's webhook request gives us,
  // which is Stripe's IP, not the customer's — so we deliberately omit
  // client_ip_address rather than send a misleading one.
  const ua = request?.headers?.get('user-agent')
  if (ua) data.client_user_agent = ua

  // Drop undefined keys — Meta rejects null values.
  return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined))
}

export async function sendMetaPurchase(env, order, request) {
  if (!metaCapiConfigured(env)) throw new Error('Meta CAPI not configured')

  const payload = {
    data: [
      {
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        // Same id the browser pixel sends, so the two dedupe into one.
        event_id: order.sessionId,
        action_source: 'website',
        event_source_url: `${env.SITE_URL || 'https://www.spongehydration.com'}/checkout?status=success`,
        user_data: await buildUserData(order, request),
        custom_data: {
          currency: (order.currency || 'usd').toUpperCase(),
          value: Number(order.amount || 0),
          content_type: 'product',
          contents: (order.items || []).map((i) => ({
            id: i.description,
            quantity: i.qty || 1,
            item_price: i.amount,
          })),
        },
      },
    ],
  }
  if (env.META_TEST_EVENT_CODE) payload.test_event_code = env.META_TEST_EVENT_CODE

  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${env.META_PIXEL_ID}/events?access_token=${encodeURIComponent(env.META_CAPI_TOKEN)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  )

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Meta CAPI ${res.status}: ${body.slice(0, 300)}`)
  }
  return res.json()
}
