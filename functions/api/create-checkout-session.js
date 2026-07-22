// Cloudflare Pages Function: POST /api/create-checkout-session
//
// Creates a Stripe Checkout Session from the cart and returns its hosted URL.
// Prices are looked up server-side from a canonical map so the client can never
// dictate what it pays - the browser only sends { id, qty }.
//
// Requires the STRIPE_SECRET_KEY environment variable (set in the Cloudflare
// Pages dashboard for production, and in .dev.vars for `wrangler pages dev`).

// Canonical catalog. Keep amounts in cents and in sync with src/data.js.
// The 2-Pack is retired and the Coaster is sold out - neither is purchasable.
const CATALOG = {
  'sponge-clip': { name: 'Sponge Hydration Tracker', amount: 5999, img: '/media/products/single.jpg' },
  'sponge-family': { name: 'Sponge Family Pack', amount: 19999, img: '/media/products/family.png' },
  'sponge-adhesive-3pack': { name: 'Magnetic Adhesive 3-Pack', amount: 1499, img: '/media/products/adhesive-3pack.jpg' },
}

const COLOR_LABELS = {
  'light-blue': 'Light Blue',
  'dark-blue': 'Dark Blue',
  black: 'Black',
  white: 'White',
  'light-gray': 'Light Gray',
  pink: 'Pink',
}

// Colors currently offered. Anything else (e.g. a cart saved before some colors
// were retired) is coerced to the default so we never sell what we can't ship.
const AVAILABLE_COLORS = ['black', 'white']
const DEFAULT_COLOR = 'black'
const coerceColor = (c) => (AVAILABLE_COLORS.includes(c) ? c : DEFAULT_COLOR)

// Authoritative US-only shipping (USPS Ground Advantage), priced by total order
// weight. ⚠️ Keep PER_ITEM_OZ and TIERS in sync with src/shipping.js.
const PER_ITEM_OZ = 4
const SHIP_TIERS = [
  { maxOz: 8, cents: 500 },
  { maxOz: 16, cents: 600 },
  { maxOz: 48, cents: 900 },
  { maxOz: Infinity, cents: 1200 },
]
const shippingCentsForItems = (itemCount) => {
  const oz = Math.max(1, itemCount) * PER_ITEM_OZ
  return (SHIP_TIERS.find((t) => oz <= t.maxOz) || SHIP_TIERS[SHIP_TIERS.length - 1]).cents
}

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } })

export async function onRequestPost({ request, env }) {
  if (!env.STRIPE_SECRET_KEY) {
    return json({ error: 'Stripe is not configured on the server.' }, 500)
  }

  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400)
  }

  const cart = Array.isArray(body?.items) ? body.items : []
  if (cart.length === 0) {
    return json({ error: 'Cart is empty.' }, 400)
  }

  const origin = new URL(request.url).origin
  const params = new URLSearchParams()
  params.set('mode', 'payment')
  params.set('success_url', `${origin}/checkout?status=success&session_id={CHECKOUT_SESSION_ID}`)
  params.set('cancel_url', `${origin}/cart`)
  params.set('billing_address_collection', 'auto')
  // US only.
  params.append('shipping_address_collection[allowed_countries][0]', 'US')

  // Tally structured data for the order sheet - Stripe line items only carry a
  // text description, so we stash exact per-color and per-SKU counts in the
  // session metadata for the webhook to read back.
  const clipCounts = { 'light-blue': 0, 'dark-blue': 0, black: 0, white: 0, 'light-gray': 0, pink: 0 }
  const skuCounts = { 'sponge-clip': 0, 'sponge-family': 0, 'sponge-adhesive-3pack': 0 }

  let line = 0
  let totalItems = 0
  for (const item of cart) {
    const product = CATALOG[item?.id]
    const qty = Math.max(1, Math.min(99, parseInt(item?.qty, 10) || 0))
    if (!product) continue
    const rawColors = Array.isArray(item?.colors) ? item.colors : item?.color ? [item.color] : []
    const colors = rawColors.map(coerceColor)
    const labels = colors.map((c) => COLOR_LABELS[c]).filter(Boolean)
    const name = labels.length ? `${product.name} - ${labels.join(', ')}` : product.name
    params.append(`line_items[${line}][quantity]`, String(qty))
    params.append(`line_items[${line}][price_data][currency]`, 'usd')
    params.append(`line_items[${line}][price_data][unit_amount]`, String(product.amount))
    params.append(`line_items[${line}][price_data][product_data][name]`, name)
    params.append(`line_items[${line}][price_data][product_data][images][0]`, `${origin}${product.img}`)
    line++
    totalItems += qty

    if (item.id in skuCounts) skuCounts[item.id] += qty
    for (const c of colors) if (c in clipCounts) clipCounts[c] += qty
  }

  if (line === 0) {
    return json({ error: 'No valid items in cart.' }, 400)
  }

  // Weight-based US shipping (USPS Ground Advantage), by item count.
  const shipAmount = shippingCentsForItems(totalItems)
  params.append('shipping_options[0][shipping_rate_data][type]', 'fixed_amount')
  params.append('shipping_options[0][shipping_rate_data][fixed_amount][amount]', String(shipAmount))
  params.append('shipping_options[0][shipping_rate_data][fixed_amount][currency]', 'usd')
  params.append(
    'shipping_options[0][shipping_rate_data][display_name]',
    shipAmount === 0 ? 'Free shipping' : 'Standard shipping'
  )

  // Metadata (string values) - keys mirror the webhook's expectations.
  params.append('metadata[clips_light_blue]', String(clipCounts['light-blue']))
  params.append('metadata[clips_dark_blue]', String(clipCounts['dark-blue']))
  params.append('metadata[clips_black]', String(clipCounts.black))
  params.append('metadata[clips_white]', String(clipCounts.white))
  params.append('metadata[clips_light_gray]', String(clipCounts['light-gray']))
  params.append('metadata[clips_pink]', String(clipCounts.pink))
  params.append('metadata[qty_single]', String(skuCounts['sponge-clip']))
  // qty_2pack stays for the order sheet's column layout; the SKU is retired.
  params.append('metadata[qty_2pack]', '0')
  params.append('metadata[qty_family]', String(skuCounts['sponge-family']))
  params.append('metadata[qty_adhesive_3pack]', String(skuCounts['sponge-adhesive-3pack']))

  const resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: params,
  })

  const session = await resp.json()
  if (!resp.ok) {
    return json({ error: session?.error?.message || 'Stripe error.' }, 502)
  }

  return json({ url: session.url })
}
