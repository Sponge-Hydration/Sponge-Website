// Cloudflare Pages Function: POST /api/subscribe
//
// Email list signup. Writes to a "Subscribers" tab in the same spreadsheet the
// order log already uses, so this needs no new credentials or third-party
// service — it reuses the Google service account that is already configured.
//
// Env vars: the same GOOGLE_SA_EMAIL / GOOGLE_SA_PRIVATE_KEY / GOOGLE_SHEET_ID
// the order sheet uses. Optional SUBSCRIBER_TAB_NAME (default "Subscribers").

import { sheetsConfigured, appendSubscriber } from './_sheets.js'

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })

// Deliberately permissive: rejecting unusual but valid addresses loses real
// subscribers, and the list is reviewed by a human anyway.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Where the signup came from, so the list can be segmented later. Anything not
// on this list is recorded as "site" rather than trusted into the sheet.
const SOURCES = new Set(['footer', 'checkout', 'notify-coaster', 'notify-product', 'blog'])

export async function onRequestPost({ request, env }) {
  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid request.' }, 400)
  }

  // Honeypot: bots fill every field they find. Return success so they do not
  // learn the field is a trap and retry with it blank.
  if (body.website) return json({ ok: true })

  const email = String(body.email || '').trim().slice(0, 200)
  if (!email || !EMAIL_RE.test(email)) {
    return json({ error: 'Please enter a valid email address.' }, 400)
  }

  const source = SOURCES.has(body.source) ? body.source : 'site'

  if (!sheetsConfigured(env)) {
    // Be honest with the client rather than pretending it worked — a signup
    // form that silently discards addresses is worse than one that is absent.
    return json({ error: 'Signups are not configured.' }, 503)
  }

  try {
    await appendSubscriber(env, { email, source })
  } catch (e) {
    console.warn('subscribe failed:', e?.message || e)
    return json({ error: 'Could not save that right now. Please try again.' }, 500)
  }

  // Always the same response whether or not the address was already present,
  // so the endpoint cannot be used to test who is on the list.
  return json({ ok: true })
}
