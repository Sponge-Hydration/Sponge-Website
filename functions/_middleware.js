// Canonical host: 301 the apex to www. Cloudflare Pages' _redirects matches on
// path only (not hostname), so host canonicalization happens here.
const CANONICAL_HOST = 'www.spongehydration.com'
const APEX_HOST = 'spongehydration.com'

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
  return context.next()
}
