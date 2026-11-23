// Canonical host: 301 the apex to www. Cloudflare Pages' _redirects matches on
// path only (not hostname), so host canonicalization happens here.
const CANONICAL_HOST = 'www.spongehydration.com'
const APEX_HOST = 'spongehydration.com'

// Price A/B test (src/pricing.js). The arm cookie is SET BY THE SERVER on every
// page response: Safari caps cookies written by page JavaScript at 7 days, but
// not first-party cookies from the site's own server, so this is what keeps an
// iPhone visitor in the same arm for the full year.
//  - known arm  -> re-issued unchanged (refreshes the year, and upgrades a cookie
//                  the page script had to write);
//  - no arm     -> assigned 50/50, plus a short-lived `sponge_ab_new` marker so
//                  the page script can prefer an arm it still remembers in
//                  localStorage (cookies cleared, site data kept);
//  - ?pv=A|B    -> that arm, from a link in an email we sent (same price on a
//                  second device);
//  - crawlers   -> nothing (they are always shown B by the page script).
export const AB_COOKIE = 'sponge_ab_price'
const AB_MAX_AGE = 60 * 60 * 24 * 365
const BOT_RE = /bot|crawl|spider|slurp|lighthouse|headless|mediapartners|facebookexternalhit|preview/i

const cookieValue = (header, name) => {
  const m = (header || '').match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))
  return m ? m[1] : null
}
const abCookie = (name, value, maxAge) =>
  `${name}=${value}; Max-Age=${maxAge}; Path=/; SameSite=Lax; Secure`

export function priceArmCookies(request, url, random = Math.random) {
  if (request.method !== 'GET' || BOT_RE.test(request.headers.get('user-agent') || '')) return []
  const fromLink = url.searchParams.get('pv')
  if (fromLink === 'A' || fromLink === 'B') return [abCookie(AB_COOKIE, fromLink, AB_MAX_AGE)]
  const current = cookieValue(request.headers.get('cookie'), AB_COOKIE)
  if (current === 'A' || current === 'B') return [abCookie(AB_COOKIE, current, AB_MAX_AGE)]
  const arm = random() < 0.5 ? 'A' : 'B'
  return [abCookie(AB_COOKIE, arm, AB_MAX_AGE), abCookie('sponge_ab_new', '1', 120)]
}

export async function onRequest(context) {
  const url = new URL(context.request.url)
  if (url.hostname === APEX_HOST) {
    url.hostname = CANONICAL_HOST
    return Response.redirect(url.toString(), 301)
  }

  // NOTE ON THE CLOUDFLARE WEB ANALYTICS BEACON
  // Measured 2026-08-25: the beacon is NOT present in the HTML at the point a
  // Pages Function sees it — Cloudflare injects it downstream of Functions, in
  // the CDN response pipeline. A diagnostic build confirmed
  // `beaconVisibleToFunction: false`. It therefore cannot be stripped, gated,
  // or consent-wrapped from this repository; only the account-level Web
  // Analytics setting can disable it. See docs/site-audit-remediation.md (A-33).
  const res = await context.next()

  const isHtml = (res.headers.get('content-type') || '').includes('text/html')
  const cacheControl = assetCacheControl(url.pathname, res.status)
  // Anything that is neither a page nor a long-cacheable file passes through.
  if (!isHtml && !cacheControl) return res

  const out = new Response(res.body, res)
  if (cacheControl) out.headers.set('Cache-Control', cacheControl)
  if (isHtml) {
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) out.headers.set(name, value)
    // Only page (HTML) responses carry the price-arm cookie.
    for (const c of priceArmCookies(context.request, url)) out.headers.append('Set-Cookie', c)
  }
  return out
}

// Security headers for every page (site audit, 2026-11-23). They are set here
// rather than in a `_headers` file because this middleware handles every
// request, and here they can be unit-tested (test/response-headers.test.js).
//  - HSTS: browsers stop trying http:// for a year. No `includeSubDomains` and
//    no `preload`: other hosts under spongehydration.com are not all ours to
//    promise HTTPS for, and preload is close to irreversible.
//  - X-Frame-Options + frame-ancestors: no other site may put these pages in a
//    frame (clickjacking). The policy is deliberately ONLY frame-ancestors. A
//    script/connect allow-list would have to name Stripe, GA4, Clarity,
//    Metricool, Meta and TikTok, and one missing host silently breaks checkout
//    or measurement; do not add one without testing each of those.
//  - Permissions-Policy: the site uses none of these, so no embedded script may.
export const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000',
  'X-Frame-Options': 'SAMEORIGIN',
  'Content-Security-Policy': "frame-ancestors 'self'",
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

// Cloudflare Pages serves every file with a 4-hour cache. Files under /assets/
// carry a content hash in their name (Vite), so a given URL never changes and
// can be kept for a year; the font has a fixed name, so it gets 30 days.
// Successful responses only: a cached 404 would outlive the deploy that fixes it.
export function assetCacheControl(pathname, status) {
  if (status !== 200 && status !== 304) return null
  if (pathname.startsWith('/assets/')) return 'public, max-age=31536000, immutable'
  if (pathname.startsWith('/fonts/')) return 'public, max-age=2592000'
  return null
}
