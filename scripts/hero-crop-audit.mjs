// Hero crop audit. The hero film is cover-cropped into a box whose aspect swings
// from 1.09 to 2.36 across viewports, so "it looks fine on my screen" proves nothing.
// This reports, per viewport, how much of every frame the crop actually discards.
//
//   node scripts/hero-crop-audit.mjs [url]
//
// Shipped after a regression where the sub-940px strip had a fixed height, letting
// its aspect reach 3.03 and discard 53% of the frame. Run it after touching the
// hero film, its dimensions, or the hero height/strip CSS.
// Measure the shipped hero at a range of viewports: how big the box is, what the
// film's aspect is, and how much of each frame the cover-crop actually discards.
import { spawn } from 'node:child_process'

const URL = process.argv[2] || 'https://www.spongehydration.com/'
const WIDTHS = [390, 600, 768, 939, 940, 1100, 1280, 1440, 1728, 1920]
const PORT = 9411
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const sleep = ms => new Promise(r => setTimeout(r, ms))

const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio',
  '--no-first-run', '--no-default-browser-check', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${process.env.TEMP}/cdp-measure`, 'about:blank'], { stdio: 'ignore' })

let ws
try {
  let targets
  for (let i = 0; i < 60; i++) {
    try {
      targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()
      if (targets.some(t => t.type === 'page')) break
    } catch {}
    await sleep(250)
  }
  const page = targets.find(t => t.type === 'page')
  ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
  let id = 0
  const pending = new Map()
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) } }
  const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })) })

  await send('Page.enable'); await send('Runtime.enable')
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `try{localStorage.setItem('sponge-privacy-v1',JSON.stringify({version:1,analytics:false,advertising:false,decidedAt:Date.now()}))}catch(e){}`,
  })

  console.log('vw    heroBox        boxAR  filmAR  mode        discarded  layout')
  for (const w of WIDTHS) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile: w < 760 })
    await send('Page.navigate', { url: URL })
    await sleep(3200)
    const { result } = await send('Runtime.evaluate', {
      expression: `(()=>{const b=document.querySelector('.hero__bg');const v=b&&b.querySelector('video,img');
        if(!b||!v)return JSON.stringify({err:'no hero bg'});
        const r=b.getBoundingClientRect();
        const nw=v.videoWidth||v.naturalWidth, nh=v.videoHeight||v.naturalHeight;
        return JSON.stringify({bw:Math.round(r.width),bh:Math.round(r.height),nw,nh,
          strip:getComputedStyle(b).top==='auto'});})()`,
      returnByValue: true,
    })
    const d = JSON.parse(result.result.value)
    if (d.err) { console.log(`${String(w).padEnd(6)}${d.err}`); continue }
    const boxAR = d.bw / d.bh, filmAR = d.nw / d.nh
    // cover: the axis with the smaller scale gets cropped
    const mode = boxAR > filmAR ? 'crops top/bot' : 'crops sides'
    const discarded = Math.round(Math.abs(1 - Math.min(boxAR, filmAR) / Math.max(boxAR, filmAR)) * 100)
    console.log(
      `${String(w).padEnd(6)}${(d.bw + 'x' + d.bh).padEnd(15)}${boxAR.toFixed(2).padEnd(7)}${filmAR.toFixed(2).padEnd(8)}${mode.padEnd(12)}${(discarded + '%').padEnd(11)}${d.strip ? 'strip' : 'full-bleed'}`)
  }
} finally {
  try { ws && ws.close() } catch {}
  chrome.kill()
}
