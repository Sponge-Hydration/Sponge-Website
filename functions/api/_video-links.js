// Per-video tracked links: spongehydration.com/v/<slug>
//
// The team lists links in the "Video Links" tab of the order sheet:
//   Slug | Platform | Video URL | Title | Posted (YYYY-MM-DD) | Destination
// e.g. tt-widget | tiktok | https://tiktok.com/@.../video/123 | Widget demo | 2026-09-24 | /shop/p/sponge-clip
// Destination is optional (defaults to the home page).
//
// Each click is appended to the "Video Clicks" tab (time, slug, platform,
// country, referrer host, bot flag). No cookies, no IP, no user id, so it
// counts every click regardless of the analytics banner. The redirect adds
// utm_source/utm_medium/utm_content so GA4 attributes opted-in visitors too.
//
// Env: GOOGLE_SA_EMAIL / GOOGLE_SA_PRIVATE_KEY / GOOGLE_SHEET_ID

import { getGoogleAccessToken } from './_google-sa.js'

export const LINKS_TAB = 'Video Links'
export const CLICKS_TAB = 'Video Clicks'
export const LINK_HEADERS = ['Slug', 'Platform', 'Video URL', 'Title', 'Posted (YYYY-MM-DD)', 'Destination']
export const CLICK_HEADERS = ['Clicked At (UTC)', 'Slug', 'Platform', 'Country', 'Referrer', 'Likely Bot']
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets'
const SITE = 'https://www.spongehydration.com'

export const normalizeSlug = (s) => String(s || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')

// Link-preview crawlers and bots that "click" when a link is posted.
export const isBot = (ua = '') =>
  /bot|crawl|spider|preview|facebookexternalhit|meta-externalagent|bytespider|tiktok.*(spider|crawler)|slackbot|discordbot|whatsapp|telegram|curl|wget|python|headless/i.test(ua)

export function parseLinks(values = []) {
  const out = {}
  for (const [slug, platform, videoUrl, title, posted, destination] of values) {
    const key = normalizeSlug(slug)
    if (!key) continue
    out[key] = {
      slug: key,
      platform: String(platform || 'other').trim().toLowerCase(),
      videoUrl: videoUrl || '',
      title: title || '',
      posted: posted || '',
      destination: destination || '/',
    }
  }
  return out
}

// Only send people to our own site: a path, or a full URL on spongehydration.com.
export function destinationUrl(link, slug) {
  let url
  try {
    url = new URL(link?.destination || '/', SITE)
  } catch {
    url = new URL('/', SITE)
  }
  if (!/(^|\.)spongehydration\.com$/i.test(url.hostname)) url = new URL('/', SITE)
  if (!url.searchParams.has('utm_source')) url.searchParams.set('utm_source', link?.platform || 'video')
  if (!url.searchParams.has('utm_medium')) url.searchParams.set('utm_medium', 'social')
  if (!url.searchParams.has('utm_content')) url.searchParams.set('utm_content', slug)
  return url.toString()
}

async function sheetGet(env, token, range) {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEET_ID}/values/${encodeURIComponent(range)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (res.status === 400) return [] // tab missing
  if (!res.ok) throw new Error(`Sheets read ${res.status}`)
  return (await res.json()).values || []
}

async function ensureTab(env, token, tab, headers) {
  const base = `https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEET_ID}`
  const meta = await fetch(`${base}?fields=sheets.properties.title`, { headers: { Authorization: `Bearer ${token}` } })
  if (!meta.ok) return
  const j = await meta.json()
  if ((j.sheets || []).some((s) => s.properties?.title === tab)) return
  await fetch(`${base}:batchUpdate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ requests: [{ addSheet: { properties: { title: tab } } }] }),
  })
  await appendRow(env, token, tab, headers)
}

async function appendRow(env, token, tab, row) {
  const range = encodeURIComponent(`'${tab}'!A1`)
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEET_ID}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ values: [row] }),
    }
  )
  if (!res.ok) throw new Error(`Sheets append ${res.status}`)
}

// Link table, cached at the edge for 5 minutes so a viral video doesn't hammer Sheets.
export async function loadLinks(env, { cache } = {}) {
  const cacheKey = new Request(`${SITE}/__cache/video-links`)
  if (cache) {
    const hit = await cache.match(cacheKey)
    if (hit) return hit.json()
  }
  const token = await getGoogleAccessToken(env, SCOPE)
  await ensureTab(env, token, LINKS_TAB, LINK_HEADERS)
  const links = parseLinks(await sheetGet(env, token, `'${LINKS_TAB}'!A2:F`))
  if (cache) {
    await cache.put(cacheKey, new Response(JSON.stringify(links), { headers: { 'cache-control': 'max-age=300', 'content-type': 'application/json' } }))
  }
  return links
}

export async function logClick(env, row) {
  const token = await getGoogleAccessToken(env, SCOPE)
  await ensureTab(env, token, CLICKS_TAB, CLICK_HEADERS)
  await appendRow(env, token, CLICKS_TAB, row)
}

export async function loadClicks(env) {
  const token = await getGoogleAccessToken(env, SCOPE)
  return (await sheetGet(env, token, `'${CLICKS_TAB}'!A2:F`)).map(([at, slug, platform, country, referrer, bot]) => ({
    at, slug, platform, country, referrer, bot: String(bot).toLowerCase() === 'true' || bot === 'TRUE',
  }))
}

export async function loadLinkTable(env) {
  const token = await getGoogleAccessToken(env, SCOPE)
  return parseLinks(await sheetGet(env, token, `'${LINKS_TAB}'!A2:F`))
}

// Weekly roll-up: human clicks per link for a window of epoch ms.
export function summarizeClicks(clicks, links, startMs, endMs) {
  const per = {}
  let bots = 0
  for (const c of clicks) {
    const t = Date.parse(c.at)
    if (!(t >= startMs && t < endMs)) continue
    if (c.bot) { bots++; continue }
    const k = c.slug || '(unknown)'
    per[k] ||= { slug: k, clicks: 0, countries: {} }
    per[k].clicks++
    if (c.country) per[k].countries[c.country] = (per[k].countries[c.country] || 0) + 1
  }
  const rows = Object.values(per)
    .map((r) => ({ ...r, ...(links[r.slug] ? { platform: links[r.slug].platform, title: links[r.slug].title, videoUrl: links[r.slug].videoUrl, posted: links[r.slug].posted } : { platform: 'unknown slug' }) }))
    .sort((a, b) => b.clicks - a.clicks)
  const byPlatform = {}
  for (const r of rows) byPlatform[r.platform] = (byPlatform[r.platform] || 0) + r.clicks
  return { totalClicks: rows.reduce((a, r) => a + r.clicks, 0), botClicksExcluded: bots, byPlatform, links: rows }
}
