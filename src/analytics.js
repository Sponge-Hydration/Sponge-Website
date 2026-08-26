// Client-side conversion tracking: GA4, Meta Pixel, TikTok Pixel.
//
// ── Design notes ───────────────────────────────────────────────────────────
// • CONSENT GATES EVERYTHING. No tag is injected and no event is sent until
//   getConsent() grants the matching category. Before the visitor decides, and
//   for any category they decline, this module makes zero network requests.
//   GA4 sits behind `analytics`; Meta and TikTok behind `advertising`, which is
//   also what Global Privacy Control switches off. See src/consent.js.
// • Every tag is additionally OPTIONAL at build time — it only exists if its ID
//   is set (VITE_GA4_ID / VITE_META_PIXEL_ID / VITE_TIKTOK_PIXEL_ID). With no
//   IDs configured this module is inert regardless of consent.
// • Pixel IDs are public by design — they ship in the page source of every site
//   that uses them. The only real secret is the Meta CAPI token, which lives
//   server-side. Never put that in a VITE_ var: anything prefixed VITE_ is
//   inlined into the client bundle.
// • SSG SAFETY: nothing here touches window/document at module scope —
//   vite-react-ssg prerenders these routes in Node.
// • Purchase is tracked in TWO places on purpose: here (browser) and from the
//   Stripe webhook (server, Meta CAPI). Both send the same event_id — the
//   Stripe checkout session id — so Meta collapses them into one conversion
//   instead of double-counting. The server copy is what survives ad blockers
//   and ITP; the browser copy is what carries click ids for attribution. The
//   server copy is gated on the same consent, carried through Stripe metadata.

import { getConsent } from './consent'

const GA4_ID = import.meta.env.VITE_GA4_ID || ''
const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || ''
const TIKTOK_PIXEL_ID = import.meta.env.VITE_TIKTOK_PIXEL_ID || ''

export const analyticsConfigured = Boolean(GA4_ID || META_PIXEL_ID || TIKTOK_PIXEL_ID)

// Which categories have actually had their scripts injected this page load.
const loaded = { analytics: false, advertising: false }

function injectScript(src) {
  const s = document.createElement('script')
  s.async = true
  s.src = src
  document.head.appendChild(s)
  return s
}

// The stock Meta and TikTok snippets do `getElementsByTagName('script')[0]`
// then `.parentNode.insertBefore(...)`, which throws outright on a document
// with no script tag. That is rare in a real page but entirely possible, and
// an exception here would propagate into the render that called us. Insert
// before the first script when there is one, otherwise just append to head.
function insertBeforeFirstScript(node) {
  const first = document.getElementsByTagName('script')[0]
  if (first && first.parentNode) first.parentNode.insertBefore(node, first)
  else document.head.appendChild(node)
}

function allow() {
  // Read fresh every time — the visitor can change their mind mid-session.
  return getConsent()
}

function loadGa4() {
  if (loaded.analytics || !GA4_ID) return
  loaded.analytics = true
  window.dataLayer = window.dataLayer || []
  // gtag must push `arguments` itself — a rest-args wrapper breaks it.
  window.gtag = function gtag() { window.dataLayer.push(arguments) }
  // Consent Mode: state the grant explicitly so GA4 behaves correctly even if
  // its own consent checks run before ours.
  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'granted',
  })
  window.gtag('js', new Date())
  // page_view is fired manually on route change, so SPA navigations are not
  // missed and the initial load is not counted twice.
  window.gtag('config', GA4_ID, { send_page_view: false })
  injectScript(`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`)
}

function loadAdTags() {
  if (loaded.advertising) return
  loaded.advertising = true

  if (META_PIXEL_ID) {
    /* eslint-disable */
    !function (f, b, e, v, n, t) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
      }
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []
      t = b.createElement(e); t.async = !0; t.src = v
      insertBeforeFirstScript(t)
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
        insertBeforeFirstScript(script)
      }
      ttq.load(TIKTOK_PIXEL_ID)
    }(window, document, 'ttq')
    /* eslint-enable */
  }
}

/**
 * Load whatever the current consent permits. Idempotent per category, so it is
 * safe to call on every event — which is exactly what the track* functions do.
 *
 * React runs child effects before parent effects, so a page component's
 * tracking effect fires BEFORE Layout's init effect on a full page load.
 * Initialising from every entry point is what stops the first event of a cold
 * load being silently dropped — which is precisely the ad-click landing we most
 * need to measure.
 */
export function initAnalytics() {
  if (typeof window === 'undefined') return
  const c = allow()
  if (c.analytics) loadGa4()
  if (c.advertising) loadAdTags()
}

export function trackPageView(path) {
  if (typeof window === 'undefined') return
  initAnalytics()
  const c = allow()
  if (c.analytics && GA4_ID && window.gtag) {
    window.gtag('event', 'page_view', { page_path: path, page_location: window.location.href })
  }
  if (c.advertising) {
    if (META_PIXEL_ID && window.fbq) window.fbq('track', 'PageView')
    if (TIKTOK_PIXEL_ID && window.ttq) window.ttq.page()
  }
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
  const c = allow()
  const items = [item]
  const value = totalValue(items)
  if (c.analytics && GA4_ID && window.gtag) {
    window.gtag('event', 'view_item', {
      currency: 'USD',
      value,
      items: [{ item_id: item.id, item_name: item.name, price: item.price, quantity: item.qty || 1 }],
    })
  }
  if (c.advertising) {
    if (META_PIXEL_ID && window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_ids: contentIds(items), content_type: 'product', value, currency: 'USD',
      })
    }
    if (TIKTOK_PIXEL_ID && window.ttq) {
      window.ttq.track('ViewContent', {
        content_id: item.id, content_type: 'product', value, currency: 'USD',
      })
    }
  }
}

export function trackAddToCart(item) {
  if (typeof window === 'undefined' || !item) return
  initAnalytics()
  const c = allow()
  const items = [item]
  const value = totalValue(items)
  if (c.analytics && GA4_ID && window.gtag) {
    window.gtag('event', 'add_to_cart', {
      currency: 'USD',
      value,
      items: [{ item_id: item.id, item_name: item.name, price: item.price, quantity: item.qty || 1 }],
    })
  }
  if (c.advertising) {
    if (META_PIXEL_ID && window.fbq) {
      window.fbq('track', 'AddToCart', {
        content_ids: contentIds(items), content_type: 'product', value, currency: 'USD',
      })
    }
    if (TIKTOK_PIXEL_ID && window.ttq) {
      window.ttq.track('AddToCart', {
        content_id: item.id, content_type: 'product', value, currency: 'USD',
      })
    }
  }
}

export function trackBeginCheckout(items, value) {
  if (typeof window === 'undefined' || !items?.length) return
  initAnalytics()
  const c = allow()
  if (c.analytics && GA4_ID && window.gtag) {
    window.gtag('event', 'begin_checkout', {
      currency: 'USD',
      value,
      items: items.map((i) => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.qty || 1 })),
    })
  }
  if (c.advertising) {
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
}

// `sessionId` is the Stripe checkout session id, reused as the Meta event_id so
// this browser event and the server-side CAPI event dedupe into one conversion.
export function trackPurchase({ sessionId, value }) {
  if (typeof window === 'undefined' || !sessionId) return
  initAnalytics()
  const c = allow()
  if (c.analytics && GA4_ID && window.gtag) {
    window.gtag('event', 'purchase', { transaction_id: sessionId, currency: 'USD', value })
  }
  if (c.advertising) {
    if (META_PIXEL_ID && window.fbq) {
      window.fbq('track', 'Purchase', { value, currency: 'USD' }, { eventID: sessionId })
    }
    if (TIKTOK_PIXEL_ID && window.ttq) {
      window.ttq.track('PlaceAnOrder', { value, currency: 'USD' }, { event_id: sessionId })
    }
  }
}
