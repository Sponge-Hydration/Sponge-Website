// Cloudflare Pages Function: POST /api/contact
//
// Receives the contact form and emails it to the team via the same Gmail
// integration the order webhook uses. Returns JSON so the client can show an
// honest success/failure state — the form must never pretend a message was
// sent when it wasn't.

import { gmailConfigured, sendGmail } from './_integrations.js'

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } })

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

export async function onRequestPost({ request, env }) {
  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid request.' }, 400)
  }

  // Honeypot: real users never fill this hidden field.
  if (body.website) return json({ ok: true })

  const name = (body.name || '').trim().slice(0, 200)
  const email = (body.email || '').trim().slice(0, 200)
  const subject = (body.subject || 'Something else').trim().slice(0, 200)
  const message = (body.message || '').trim().slice(0, 5000)

  if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Please fill in your name, a valid email, and a message.' }, 400)
  }

  if (!gmailConfigured(env)) {
    // Be honest with the client so it can show the direct-email fallback.
    return json({ error: 'Contact form is not available right now.' }, 503)
  }

  const to = env.TEAM_EMAIL || 'team@spongehydration.com'
  try {
    await sendGmail(env, {
      to,
      subject: `Contact form: ${subject} — ${name}`,
      html: `
        <h2>Website contact form</h2>
        <p><strong>From:</strong> ${esc(name)} &lt;${esc(email)}&gt;</p>
        <p><strong>Topic:</strong> ${esc(subject)}</p>
        <p style="white-space:pre-wrap">${esc(message)}</p>
        <p style="color:#888">Reply directly to the customer at ${esc(email)}.</p>`,
    })
  } catch (err) {
    console.error('contact form send failed:', err?.message || err)
    return json({ error: 'Could not send your message.' }, 502)
  }

  return json({ ok: true })
}
