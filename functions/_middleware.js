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
  return context.next()
}
