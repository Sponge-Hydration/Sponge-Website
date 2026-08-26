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

  // TEMPORARY DIAGNOSTIC (remove after use). Answers one question: is the
  // Cloudflare Web Analytics beacon present in the HTML at the time a Pages
  // Function sees it, or is it injected downstream by the CDN? If it is
  // present here we can strip/gate it in code; if not, only the account-level
  // Web Analytics setting can turn it off. Gated on a query param so ordinary
  // traffic is completely unaffected.
  if (url.searchParams.get('__cfdiag') === '1') {
    const res = await context.next()
    const html = await res.text()
    return new Response(
      JSON.stringify({
        beaconVisibleToFunction: html.includes('cloudflareinsights'),
        cfBeaconAttrPresent: html.includes('data-cf-beacon'),
        htmlBytes: html.length,
        contentType: res.headers.get('content-type'),
      }),
      { headers: { 'content-type': 'application/json' } }
    )
  }

  return context.next()
}
