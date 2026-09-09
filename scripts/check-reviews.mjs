#!/usr/bin/env node
// Tells you exactly what state the live reviews feed is in, and what to do next.
//   node scripts/check-reviews.mjs
// Optional: pass a different origin, e.g.
//   node scripts/check-reviews.mjs https://staging.example.com

const ORIGIN = (process.argv[2] || 'https://www.spongehydration.com').replace(/\/+$/, '')
const URL_ = `${ORIGIN}/api/reviews`

const b = (s) => `\x1b[1m${s}\x1b[0m`
const red = (s) => `\x1b[31m${s}\x1b[0m`
const green = (s) => `\x1b[32m${s}\x1b[0m`
const yellow = (s) => `\x1b[33m${s}\x1b[0m`
const dim = (s) => `\x1b[2m${s}\x1b[0m`

const say = (...a) => console.log(...a)

function verdict(title, colour, lines) {
  say('')
  say(colour(b(title)))
  for (const l of lines) say('  ' + l)
  say('')
}

const res = await fetch(URL_, { redirect: 'follow' }).catch((e) => {
  verdict('COULD NOT REACH THE SITE', red, [
    `${URL_} did not respond.`,
    dim(String(e?.message || e)),
  ])
  process.exit(2)
})

say(dim(`GET ${res.url} -> ${res.status}`))

let body = null
try {
  body = await res.json()
} catch {
  /* non-JSON handled below */
}

if (res.status === 503) {
  verdict('NOT CONNECTED - credentials are missing', red, [
    'Cloudflare has no Airtable credentials, so the site is serving the baked-in',
    'snapshot from src/data.js. Those reviews are real, but frozen.',
    '',
    b('Fix:') + ' Cloudflare dashboard -> Workers & Pages -> your site ->',
    '  Settings -> Environment variables -> Production. Add:',
    '    AIRTABLE_API_KEY        your Airtable personal access token',
    '    AIRTABLE_BASE_ID        apppnrhDp10j1dZ7c',
    '    AIRTABLE_REVIEWS_TABLE  Reviews        (optional - this is the default)',
    '',
    'Then redeploy, because Pages Functions only pick up new variables on deploy.',
  ])
  process.exit(1)
}

if (res.status === 502) {
  verdict('CONNECTED, BUT AIRTABLE REFUSED', red, [
    'The variables are set, but the call to Airtable failed. Usually one of:',
    '  - the token lacks the data.records:read scope',
    '  - the token was not granted access to this specific base',
    '  - AIRTABLE_BASE_ID is wrong (should be apppnrhDp10j1dZ7c)',
    '  - AIRTABLE_REVIEWS_TABLE does not match the table name',
  ])
  process.exit(1)
}

if (!res.ok || !body || !Array.isArray(body.reviews)) {
  verdict('UNEXPECTED RESPONSE', red, [
    `Status ${res.status}.`,
    dim(JSON.stringify(body).slice(0, 300)),
  ])
  process.exit(1)
}

const n = body.reviews.length

if (n === 0) {
  verdict('CONNECTED - but nothing is approved yet', yellow, [
    'Airtable is reachable and the credentials work. It returned zero reviews,',
    'which means no row is both approved and has written feedback.',
    '',
    'This is safe: the site keeps showing the real baked-in reviews when the',
    'feed is empty, so nothing has broken on the page.',
    '',
    b('Fix:') + ' in Airtable, add a checkbox column named one of:',
    '    Approved / Published / Show on site / Live / Featured',
    '  then tick the reviews you want public. Each needs Open Feedback filled in.',
    '',
    dim('Note: responses are edge-cached for 10 minutes, so allow for that.'),
  ])
  process.exit(1)
}

const stars = body.reviews.map((r) => r.stars)
const avg = (stars.reduce((a, c) => a + c, 0) / n).toFixed(2)

verdict(`LIVE - ${n} approved review${n === 1 ? '' : 's'} serving from Airtable`, green, [
  `Average rating ${avg} of 5.`,
  '',
  ...body.reviews.slice(0, 5).map((r) => {
    const q = r.quote.length > 66 ? r.quote.slice(0, 63) + '...' : r.quote
    return `  ${'*'.repeat(r.stars)}${' '.repeat(5 - r.stars)}  ${q}`
  }),
  ...(n > 5 ? [dim(`  ... and ${n - 5} more`)] : []),
  '',
  'Approving a new review in Airtable now updates the site within 10 minutes,',
  'with no redeploy needed.',
  '',
  yellow('Keep src/data.js in sync') + ' - it is what prerenders and what shows if',
  'Airtable is ever unreachable.',
])
