import { useState } from 'react'
import { Seo } from '../components/useSEO'
import { SectionHead } from '../components/bits'
import { CheckCircleIcon } from '../components/icons'

export default function Contact() {
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState('')
  const sent = status === 'sent'

  const submit = async (e) => {
    e.preventDefault()
    setStatus('sending')
    setErrorMsg('')
    const form = new FormData(e.target)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: form.get('name'),
          email: form.get('email'),
          subject: form.get('subject'),
          message: form.get('message'),
          website: form.get('website'), // honeypot
        }),
      })
      let data = null
      try {
        data = await res.json()
      } catch {
        /* non-JSON response (e.g. plain Vite dev server without functions) */
      }
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Could not send your message.')
      setStatus('sent')
      window.scrollTo(0, 0)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err.message || 'Could not send your message.')
    }
  }

  return (
    <section className="section">
      <Seo
        title={'Contact Sponge | Support & Sales'}
        description="Get in touch with the Sponge team about orders, the caregiver program, or hydration tracker support."
        path="/contact"
      />
      <div className="container">
        <SectionHead eyebrow="Contact" title="We’d love to hear from you">
          Questions about an order, the caregiver program, or your Sponge? Send a note and we’ll reply within one business day.
        </SectionHead>

        <div className="contact-layout">
          {sent ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <div className="empty-state__icon" aria-hidden="true"><CheckCircleIcon size={56} /></div>
              <h2>Thanks, message sent!</h2>
              <p>We’ll get back to you within one business day.</p>
            </div>
          ) : (
            <form className="checkout-form" onSubmit={submit}>
              <div className="form-row">
                <label>Name<input name="name" required placeholder="Your name" /></label>
                <label>Email<input name="email" type="email" required placeholder="you@email.com" /></label>
              </div>
              <label>Subject
                <select name="subject" defaultValue="">
                  <option value="" disabled>Choose a topic</option>
                  <option>Order or shipping</option>
                  <option>Setup &amp; support</option>
                  <option>Caregiver program</option>
                  <option>Returns &amp; warranty</option>
                  <option>Something else</option>
                </select>
              </label>
              <label>Message<textarea name="message" required rows={5} placeholder="How can we help?" /></label>
              {/* Honeypot, hidden from real users, catches bots. */}
              <input name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }} />
              {status === 'error' && (
                <p role="alert" style={{ color: 'crimson' }}>
                  {errorMsg} You can also email us directly at{' '}
                  <a href="mailto:team@spongehydration.com" style={{ textDecoration: 'underline' }}>team@spongehydration.com</a>.
                </p>
              )}
              <button type="submit" className="btn btn--primary btn--lg" disabled={status === 'sending'}>
                {status === 'sending' ? 'Sending…' : 'Send message'}
              </button>
            </form>
          )}

          <aside className="contact-aside">
            <h3>Other ways to reach us</h3>
            <p><strong>Email</strong><br />team@spongehydration.com</p>
            <p><strong>Hours</strong><br />Mon-Fri, 9am-6pm ET</p>
          </aside>
        </div>
      </div>
    </section>
  )
}
