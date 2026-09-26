#!/usr/bin/env node
// One-off / re-runnable: copy every expired (abandoned) Stripe Checkout session
// into the "Abandoned Carts" tab. Safe to run again: sessions already in the tab
// are skipped. Reads STRIPE_SECRET_KEY + GOOGLE_SA_* + GOOGLE_SHEET_ID from
// .dev.vars.
//
//   node scripts/backfill-abandoned-carts.mjs          # dry run: list only
//   node scripts/backfill-abandoned-carts.mjs --write  # write missing rows

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { abandonedRow, logAbandonedCart } from '../functions/api/_abandoned.js'

const env = {}
const devVars = join(dirname(fileURLToPath(import.meta.url)), '..', '.dev.vars')
for (const line of readFileSync(devVars, 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) env[m[1]] = m[2].trim().replace(/^"(.*)"$/, '$1')
}
const write = process.argv.includes('--write')

const sessions = []
let after = ''
for (;;) {
  const url = `https://api.stripe.com/v1/checkout/sessions?status=expired&limit=100${after ? `&starting_after=${after}` : ''}`
  const page = await (await fetch(url, { headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` } })).json()
  if (page.error) throw new Error(page.error.message)
  sessions.push(...page.data)
  if (!page.has_more) break
  after = page.data.at(-1).id
}
sessions.reverse() // oldest first, so the tab reads chronologically

const recovery = { skipped: 'expired before the abandoned-cart log existed' }
console.log(`${sessions.length} expired sessions${write ? '' : ' (dry run, pass --write to log)'}`)
let logged = 0
for (const s of sessions) {
  if (!write) { console.log(abandonedRow(s, recovery).join(' | ')); continue }
  const r = await logAbandonedCart(s, env, recovery)
  if (r.logged) logged++
}
if (write) console.log(`logged ${logged}, skipped ${sessions.length - logged} already present`)
