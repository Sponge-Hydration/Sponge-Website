// GET /v/<slug> — per-video tracked link. Logs the click (no cookies, no IP)
// and 302s to the destination listed in the "Video Links" sheet tab, with UTM
// tags added. Unknown slugs still redirect (to the home page) and are logged,
// so a typo in a caption never shows a visitor an error page.
// See functions/api/_video-links.js.

import { loadLinks, logClick, destinationUrl, normalizeSlug, isBot } from '../api/_video-links.js'
import { serviceAccountConfigured } from '../api/_google-sa.js'

export const BIO_PLATFORMS = new Set(['tiktok', 'instagram', 'youtube', 'facebook', 'x', 'linkedin', 'pinterest', 'threads', 'email'])

export async function onRequestGet(context) {
  const { request, env, params } = context
  const slug = normalizeSlug(params.slug)
  let link = null
  const configured = serviceAccountConfigured(env) && env.GOOGLE_SHEET_ID
  if (configured) {
    try {
      const links = await loadLinks(env, { cache: typeof caches !== 'undefined' ? caches.default : undefined })
      link = links[slug] || null
    } catch (e) {
      console.warn('video link lookup failed:', e?.message || e)
    }
  }
  // Profile/bio links (/v/tiktok, /v/instagram, /v/youtube, ...) work without
  // a sheet row: the slug itself names the platform.
  if (!link && BIO_PLATFORMS.has(slug)) link = { slug, platform: slug, destination: '/' }
  const target = destinationUrl(link || { platform: 'video', destination: '/' }, slug || 'unknown')

  if (configured) {
    const ua = request.headers.get('user-agent') || ''
    let refHost = ''
    try { refHost = new URL(request.headers.get('referer') || '').hostname } catch {}
    const row = [
      new Date().toISOString(),
      slug || '(empty)',
      link?.platform || 'unknown slug',
      request.cf?.country || '',
      refHost,
      isBot(ua) ? 'TRUE' : 'FALSE',
    ]
    const p = logClick(env, row).catch((e) => console.warn('video click log failed:', e?.message || e))
    if (context.waitUntil) context.waitUntil(p)
  }

  return new Response(null, {
    status: 302,
    headers: { Location: target, 'cache-control': 'no-store', 'referrer-policy': 'no-referrer-when-downgrade' },
  })
}
