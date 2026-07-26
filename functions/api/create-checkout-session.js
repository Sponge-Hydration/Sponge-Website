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

// Authoritative US-only shipping — real USPS Ground Advantage RETAIL rates.
// ⚠️ MIRRORED in src/shipping.js (that copy is in dollars; this one is in CENTS).
// The server is what Stripe actually charges, so this is the source of truth.
//
// Hosted Checkout fixes shipping at session-creation time, before we see the
// destination address, so we can't know the real USPS zone. We charge a flat
// rate per weight tier from a representative zone (REP_ZONE). See src/shipping.js
// for the full rationale and how to change REP_ZONE. Rates are Notice 123,
// effective 2026-07-12 (pe.usps.com). Family Pack now weighs as 4 clips.
const REP_ZONE = 5 // representative USPS zone (1–9) for the flat rate
const SKU_WEIGHT_OZ = { 'sponge-clip': 4, 'sponge-family': 16, 'sponge-adhesive-3pack': 2 }
const DEFAULT_ITEM_OZ = 4
const BOX_OZ = 2 // packaging + padding, added once per shipment

// USPS Ground Advantage — Retail, price in CENTS by weight tier and zone.
// rates index 0..8 == zones 1..9. maxOz is the USPS "weight not over" break.
const GA_RETAIL = [
  { maxOz: 4, rates: [790, 805, 815, 830, 860, 875, 895, 945, 945] },
  { maxOz: 8, rates: [790, 805, 815, 830, 860, 875, 895, 945, 945] },
  { maxOz: 12, rates: [955, 995, 1020, 1060, 1095, 1135, 1195, 1290, 1290] },
  { maxOz: 16, rates: [955, 995, 1020, 1060, 1095, 1135, 1195, 1290, 1290] },
  { maxOz: 32, rates: [1080, 1150, 1220, 1300, 1410, 1510, 1645, 1905, 1905] },
  { maxOz: 48, rates: [1130, 1200, 1265, 1370, 1495, 1645, 1895, 2240, 2240] },
  { maxOz: 64, rates: [1225, 1275, 1365, 1485, 1640, 1830, 2090, 2425, 2425] },
  { maxOz: 80, rates: [1295, 1355, 1455, 1580, 1745, 1960, 2240, 2605, 2605] },
  { maxOz: 96, rates: [1350, 1390, 1485, 1635, 1840, 2105, 2435, 2835, 2835] },
  { maxOz: 112, rates: [1400, 1440, 1540, 1710, 1945, 2255, 2625, 3060, 3060] },
  { maxOz: 128, rates: [1460, 1485, 1580, 1765, 2040, 2410, 2845, 3315, 3315] },
  { maxOz: 144, rates: [1510, 1540, 1625, 1830, 2140, 2555, 3075, 3570, 3570] },
  { maxOz: 160, rates: [1595, 1630, 1725, 1940, 2285, 2750, 3330, 3945, 3945] },
]

const shippingCentsForWeight = (oz) => {
  const tier = GA_RETAIL.find((t) => oz <= t.maxOz) || GA_RETAIL[GA_RETAIL.length - 1]
  return tier.rates[REP_ZONE - 1]
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

  // Destination-based US sales tax via Stripe Tax. Gated on an env flag because
  // it hard-requires dashboard setup (enable Stripe Tax + an origin address +
  // tax registrations); turning it on before that is done makes Stripe reject
  // every session. Set STRIPE_TAX_ENABLED="true" once the dashboard is ready.
  const taxEnabled = env.STRIPE_TAX_ENABLED === 'true'

  const origin = new URL(request.url).origin
  const params = new URLSearchParams()
  params.set('mode', 'payment')
  params.set('success_url', `${origin}/checkout?status=success&session_id={CHECKOUT_SESSION_ID}`)
  params.set('cancel_url', `${origin}/cart`)
  params.set('billing_address_collection', 'auto')
  // US only.
  params.append('shipping_address_collection[allowed_countries][0]', 'US')
  if (taxEnabled) {
    // Stripe computes tax from the shipping address entered on its hosted page.
    params.set('automatic_tax[enabled]', 'true')
  }

  // Tally structured data for the order sheet - Stripe line items only carry a
  // text description, so we stash exact per-color and per-SKU counts in the
  // session metadata for the webhook to read back.
  const clipCounts = { 'light-blue': 0, 'dark-blue': 0, black: 0, white: 0, 'light-gray': 0, pink: 0 }
  const skuCounts = { 'sponge-clip': 0, 'sponge-family': 0, 'sponge-adhesive-3pack': 0 }

  let line = 0
  let totalWeightOz = 0
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
    if (taxEnabled) {
      // Tax added on top of the price; txcd_99999999 = general tangible goods.
      params.append(`line_items[${line}][price_data][tax_behavior]`, 'exclusive')
      params.append(`line_items[${line}][price_data][product_data][tax_code]`, 'txcd_99999999')
    }
    line++
    totalWeightOz += (SKU_WEIGHT_OZ[item.id] ?? DEFAULT_ITEM_OZ) * qty

    if (item.id in skuCounts) skuCounts[item.id] += qty
    for (const c of colors) if (c in clipCounts) clipCounts[c] += qty
  }

  if (line === 0) {
    return json({ error: 'No valid items in cart.' }, 400)
  }

  // Flat USPS Ground Advantage retail shipping, by total package weight.
  const shipAmount = shippingCentsForWeight(totalWeightOz + BOX_OZ)
  params.append('shipping_options[0][shipping_rate_data][type]', 'fixed_amount')
  params.append('shipping_options[0][shipping_rate_data][fixed_amount][amount]', String(shipAmount))
  params.append('shipping_options[0][shipping_rate_data][fixed_amount][currency]', 'usd')
  params.append('shipping_options[0][shipping_rate_data][display_name]', 'USPS Ground Advantage')
  if (taxEnabled) {
    // Let Stripe tax shipping per destination rules; txcd_92010001 = shipping.
    params.append('shipping_options[0][shipping_rate_data][tax_behavior]', 'exclusive')
    params.append('shipping_options[0][shipping_rate_data][tax_code]', 'txcd_92010001')
  }

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
