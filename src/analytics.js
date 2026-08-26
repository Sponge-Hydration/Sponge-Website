// Client-side conversion tracking: GA4, Meta Pixel, TikTok Pixel.
//
// ── Design notes ───────────────────────────────────────────────────────────
// • Every tag is OPTIONAL. A tag only loads if its ID is present at build time
//   (VITE_GA4_ID / VITE_META_PIXEL_ID / VITE_TIKTOK_PIXEL_ID). With no IDs set
//   this module is inert and adds zero network requests, so local dev and
//   preview builds stay clean.
// • Pixel IDs are public by design — they ship in the page source of every site
//   that uses them. The only real secret is the Meta CAPI token, which lives
//   server-side in functions/api/webhook.js. Never put that in a VITE_ var:
//   anything prefixed VITE_ is inlined into the client bundle.
// • SSG SAFETY: this file must not touch window/document at module scope —
//   vite-react-ssg prerenders these routes in Node. Everything is guarded and
//   only runs from effects.
// • Purchase is tracked in TWO places on purpose: here (browser) and from the
//   Stripe webhook (server, Meta CAPI). Both send the same event_id — the
//   Stripe checkout session id — so Meta collapses them into one conversion
//   instead of double-counting. The server copy is what survives ad blockers
//   and ITP; the browser copy is what carries click ids for attribution.

const GA4_ID = import.meta.env.VITE_GA4_ID || ''
const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || ''
const TIKTOK_PIXEL_ID = import.meta.env.VITE_TIKTOK_PIXEL_ID || ''

export const analyticsEnabled = Boolean(GA4_ID || META_PIXEL_ID || TIKTOK_PIXEL_ID)

let started = false

function injectScript(src, attrs = {}) {
  const s = document.createElement('script')
  s.async = true
  s.src = src
  Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v))
  document.head.appendChild(s)
  return s
}

// Load the tags once, on first client render. Safe to call repeatedly.
export function initAnalytics() {
  if (started || typeof window === 'undefined') return
  started = true

  if (GA4_ID) {
    window.dataLayer = window.dataLayer || []
    // gtag must push `arguments` itself — a rest-args wrapper breaks it.
    window.gtag = function gtag() { window.dataLayer.push(arguments) }
    window.gtag('js', new Date())
    // We fire page_view manually on route change instead, so SPA navigations
    // are not missed and the initial load is not counted twice.
    window.gtag('config', GA4_ID, { send_page_view: false })
    injectScript(`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`)
  }

  if (META_PIXEL_ID) {
    /* eslint-disable */
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
      }
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []
      t = b.createElement(e); t.async = !0; t.src = v
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s)
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js')
    /* eslint-enable */
    window.fbq('init', META_PIXEL_ID)
  }

  if (TIKTOK_PIXEL_ID) {
    /* eslint-disable */
    !function (w, d, t) {
      w.TiktokAnalyticsObject = t
      var ttq = w[t] = w[t] || []
      ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie']
      ttq.setAndDefer = function (obj, m) { obj[m] = function () { obj.push([m].concat(Array.prototype.slice.call(arguments, 0))) } }
      for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i])
      ttq.instance = function (id) {
        var inst = ttq._i[id] || []
        for (var j = 0; j < ttq.methods.length; j++) ttq.setAndDefer(inst, ttq.methods[j])
        return inst
      }
      ttq.load = function (id, opts) {
        var url = 'https://analytics.tiktok.com/i18n/pixel/events.js'
        ttq._i = ttq._i || {}; ttq._i[id] = []; ttq._i[id]._u = url
        ttq._t = ttq._t || {}; ttq._t[id] = +new Date()
        ttq._o = ttq._o || {}; ttq._o[id] = opts || {}
        var script = d.createElement('script')
        script.type = 'text/javascript'; script.async = !0; script.src = url + '?sdkid=' + id + '&lib=' + t
        var first = d.getElementsByTagName('script')[0]
        first.parentNode.insertBefore(script, first)
      }
      ttq.load(TIKTOK_PIXEL_ID)
    }(window, document, 'ttq')
    /* eslint-enable */
  }
}

// React runs child effects before parent effects, so a page component's
// tracking effect fires BEFORE Layout's init effect on a full page load. Every
// track* entry point therefore initialises first — initAnalytics is idempotent,
// so this is a no-op on the SPA navigations where init has already happened.
// Without this, the first event of every cold load is silently dropped, which
// is exactly the ad-click landing we most need to measure.
export function trackPageView(path) {
  if (typeof window === 'undefined') return
  initAnalytics()
  if (GA4_ID && window.gtag) {
    window.gtag('event', 'page_view', { page_path: path, page_location: window.location.href })
  }
  if (META_PIXEL_ID && window.fbq) window.fbq('track', 'PageView')
  if (TIKTOK_PIXEL_ID && window.ttq) window.ttq.page()
}

// `items` is [{ id, name, price, qty }]. Each platform gets its own shape.
function contentIds(items) {
  return items.map((i) => i.id)
}
function totalValue(items) {
  return Number(items.reduce((sum, i) => sum + i.price * (i.qty || 1), 0).toFixed(2))
}

export function trackViewItem(item) {
  if (typeof window === 'undefined' || !item) return
  initAnalytics()
  const items = [item]
  if (GA4_ID && window.gtag) {
    window.gtag('event', 'view_item', {
      currency: 'USD',
      value: totalValue(items),
      items: [{ item_id: item.id, item_name: item.name, price: item.price, quantity: item.qty || 1 }],
    })
  }
  if (META_PIXEL_ID && window.fbq) {
    window.fbq('track', 'ViewContent', {
      content_ids: contentIds(items), content_type: 'product',
      value: totalValue(items), currency: 'USD',
    })
  }
  if (TIKTOK_PIXEL_ID && window.ttq) {
    window.ttq.track('ViewContent', {
      content_id: item.id, content_type: 'product',
      value: totalValue(items), currency: 'USD',
    })
  }
}

export function trackAddToCart(item) {
  if (typeof window === 'undefined' || !item) return
  initAnalytics()
  const items = [item]
  if (GA4_ID && window.gtag) {
    window.gtag('event', 'add_to_cart', {
      currency: 'USD',
      value: totalValue(items),
      items: [{ item_id: item.id, item_name: item.name, price: item.price, quantity: item.qty || 1 }],
    })
  }
  if (META_PIXEL_ID && window.fbq) {
    window.fbq('track', 'AddToCart', {
      content_ids: contentIds(items), content_type: 'product',
      value: totalValue(items), currency: 'USD',
    })
  }
  if (TIKTOK_PIXEL_ID && window.ttq) {
    window.ttq.track('AddToCart', {
      content_id: item.id, content_type: 'product',
      value: totalValue(items), currency: 'USD',
    })
  }
}

export function trackBeginCheckout(items, value) {
  if (typeof window === 'undefined' || !items?.length) return
  initAnalytics()
  if (GA4_ID && window.gtag) {
    window.gtag('event', 'begin_checkout', {
      currency: 'USD',
      value,
      items: items.map((i) => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.qty || 1 })),
    })
  }
  if (META_PIXEL_ID && window.fbq) {
    window.fbq('track', 'InitiateCheckout', {
      content_ids: contentIds(items), content_type: 'product', value, currency: 'USD',
      num_items: items.reduce((n, i) => n + (i.qty || 1), 0),
    })
  }
  if (TIKTOK_PIXEL_ID && window.ttq) {
    window.ttq.track('InitiateCheckout', { content_type: 'product', value, currency: 'USD' })
  }
}

// `sessionId` is the Stripe checkout session id, reused as the Meta event_id so
// this browser event and the server-side CAPI event dedupe into one conversion.
export function trackPurchase({ sessionId, value }) {
  if (typeof window === 'undefined' || !sessionId) return
  initAnalytics()
  if (GA4_ID && window.gtag) {
    window.gtag('event', 'purchase', { transaction_id: sessionId, currency: 'USD', value })
  }
  if (META_PIXEL_ID && window.fbq) {
    window.fbq('track', 'Purchase', { value, currency: 'USD' }, { eventID: sessionId })
  }
  if (TIKTOK_PIXEL_ID && window.ttq) {
    window.ttq.track('PlaceAnOrder', { value, currency: 'USD' }, { event_id: sessionId })
  }
}
