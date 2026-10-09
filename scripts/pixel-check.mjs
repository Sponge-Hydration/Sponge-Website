// Loads a URL in headless Chrome (presenting as ordinary Chrome, because Meta's
// script drops events from "HeadlessChrome") and lists every event sent to Meta.
// usage: node scripts/pixel-check.mjs <url> <none|deny|allow> [manual|addtocart]
//   none = first-time visitor, deny = advertising declined, allow = advertising allowed
//   manual = also fire one ViewContent by hand; addtocart = also click Add to cart
// Expect: none/deny -> zero requests to Meta. allow -> PageView (plus ViewContent
// on a product page, AddToCart after the click), and nothing else.
import { spawn } from 'node:child_process'

const [url, mode = 'none', extra = ''] = process.argv.slice(2)
const PORT = 9400 + Math.floor(Math.random() * 400)
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const WAIT = Number(process.env.WAIT_MS) || 10000

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--mute-audio', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${process.env.TEMP}/cdp-pixel-${PORT}`, 'about:blank',
], { stdio: 'ignore' })

function eventOf(u, body) {
  const q = new URL(u).searchParams
  const pick = (name) => {
    if (q.get(name)) return q.get(name)
    if (!body) return null
    const enc = body.match(new RegExp('(?:^|&)' + name + '=([^&]+)'))
    const multi = body.match(new RegExp('name="' + name + '"[\\r\\n]+([^\\r\\n]+)'))
    return (enc || multi || [])[1] || null
  }
  return { ev: pick('ev'), id: pick('id'), ec: pick('ec'), ts: pick('ts') }
}

try {
  let target
  for (let i = 0; i < 60 && !target; i++) {
    try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find((t) => t.type === 'page') } catch { await sleep(250) }
  }
  if (!target) throw new Error('Chrome did not start')
  const ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
  let id = 0
  const pending = new Map()
  const reqs = []
  ws.onmessage = (msg) => {
    const m = JSON.parse(msg.data)
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id) }
    if (m.method === 'Network.requestWillBeSent') reqs.push({ url: m.params.request.url, body: m.params.request.postData || '' })
  }
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })) })
  const evalJs = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true })).result.value

  await send('Network.enable')
  await send('Page.enable')
  const ua = (await send('Browser.getVersion')).userAgent.replace('HeadlessChrome', 'Chrome')
  await send('Network.setUserAgentOverride', { userAgent: ua })
  if (mode !== 'none') {
    const consent = JSON.stringify({ version: 1, analytics: false, advertising: mode === 'allow', decidedAt: 1 })
    await send('Page.addScriptToEvaluateOnNewDocument', { source: `try{localStorage.setItem('sponge-privacy-v1', ${JSON.stringify(consent)})}catch(e){}` })
  }
  await send('Page.navigate', { url })
  await sleep(WAIT)

  const metaReqs = () => reqs.filter((r) => /facebook\.(com|net)|fbcdn/.test(r.url))
  const events = () => {
    const seen = new Set()
    const out = []
    for (const r of metaReqs().filter((x) => x.url.includes('facebook.com/tr'))) {
      const e = eventOf(r.url, r.body)
      const key = e.ev + '|' + e.ts + '|' + e.ec
      if (seen.has(key)) continue // the same event reported twice at the network level
      seen.add(key)
      out.push(`${e.ev}#${e.ec}`)
    }
    return out
  }

  const result = { mode, requestsToMeta: metaReqs().length, pixelScriptLoaded: metaReqs().some((r) => r.url.includes('fbevents.js')), events: events() }
  if (mode === 'allow') result.libraryEventCount = await evalJs("window.fbq && window.fbq.getState ? window.fbq.getState().pixels.map(function(p){return p.eventCount}).join(',') : 'no fbq'")

  if (extra === 'manual') {
    await evalJs("window.fbq('track','ViewContent',{content_ids:['sponge-clip'],content_type:'product',value:59.99,currency:'USD'}); 1")
    await sleep(8000)
    result.afterManualViewContent = { events: events(), libraryEventCount: await evalJs("window.fbq.getState().pixels.map(function(p){return p.eventCount}).join(',')") }
  }
  if (extra === 'addtocart') {
    result.clicked = await evalJs("(function(){var b=Array.prototype.slice.call(document.querySelectorAll('button')).filter(function(x){return /add to cart/i.test(x.textContent)})[0]; if(!b) return 'no button'; b.click(); return b.textContent.trim()})()")
    await sleep(6000)
    result.afterAddToCart = events()
  }
  console.log(JSON.stringify(result))
  ws.close()
} finally {
  chrome.kill()
}
