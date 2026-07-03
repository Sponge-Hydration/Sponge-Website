import { useState } from 'react'
import { useSEO } from '../components/useSEO'
import { SectionHead } from '../components/bits'
import { CheckCircleIcon } from '../components/icons'

export default function Contact() {
  useSEO({
    title: 'Contact Sponge | Support & Sales',
    description: 'Get in touch with the Sponge team about orders, the caregiver program, or hydration tracker support.',
    path: '/contact',
  })
  const [sent, setSent] = useState(false)

  return (
    <section className="section">
      <div className="container">
        <SectionHead eyebrow="Contact" title="We’d love to hear from you">
          Questions about an order, the caregiver program, or your Sponge? Send a note and we’ll reply within one business day.
        </SectionHead>

        <div className="contact-layout">
          {sent ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <div className="empty-state__icon" aria-hidden="true"><CheckCircleIcon size={56} /></div>
              <h2>Thanks — message sent!</h2>
              <p>We’ll get back to you within one business day.</p>
            </div>
          ) : (
            <form className="checkout-form" onSubmit={(e) => { e.preventDefault(); setSent(true); window.scrollTo(0, 0) }}>
              <div className="form-row">
                <label>Name<input required placeholder="Your name" /></label>
                <label>Email<input type="email" required placeholder="you@email.com" /></label>
              </div>
              <label>Subject
                <select defaultValue="">
                  <option value="" disabled>Choose a topic</option>
                  <option>Order or shipping</option>
                  <option>Setup &amp; support</option>
                  <option>Caregiver program</option>
                  <option>Returns &amp; warranty</option>
                  <option>Something else</option>
                </select>
              </label>
              <label>Message<textarea required rows={5} placeholder="How can we help?" /></label>
              <button type="submit" className="btn btn--primary btn--lg">Send message</button>
            </form>
          )}

          <aside className="contact-aside">
            <h3>Other ways to reach us</h3>
            <p><strong>Support</strong><br />support@spongehydration.com</p>
            <p><strong>Caregiver team</strong><br />care@spongehydration.com</p>
            <p><strong>Hours</strong><br />Mon–Fri, 9am–6pm ET</p>
          </aside>
        </div>
      </div>
    </section>
  )
}
