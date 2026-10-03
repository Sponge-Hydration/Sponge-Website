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

  // Only page (HTML) responses carry the price-arm cookie; assets are untouched.
  if (!(res.headers.get('content-type') || '').includes('text/html')) return res
  const cookies = priceArmCookies(context.request, url)
  if (!cookies.length) return res
  const out = new Response(res.body, res)
  for (const c of cookies) out.headers.append('Set-Cookie', c)
  return out
}
