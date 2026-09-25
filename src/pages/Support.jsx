import { Link } from 'react-router-dom'
import { Seo } from '../components/useSEO'
import { SectionHead } from '../components/bits'

// The customer support hub (added 2026-09-23). Every promise here is restated
// from a policy that already exists — the Pre-Order, Return and Warranty
// policies, the Privacy Policy and the Contact page's reply time — and links
// to it. If one of those changes, change it here too. Do not add
// troubleshooting steps that are not in the setup guide or the tutorials.
const TOPICS = [
  {
    title: 'Set up your Sponge',
    text: 'Charge it over USB-C, pair the free app over Bluetooth, and snap it onto your bottle. The animated guide covers every step, and the video tutorials show unboxing and attaching it to your bottle.',
    links: [
      { to: '/how-it-works', label: 'Setup guide' },
      { to: '/how-it-works#tutorials', label: 'Video tutorials' },
    ],
  },
  {
    title: 'Track your order',
    text: 'Your order confirmation email has a link to your order status page, which shows tracking once your order ships. For a pre-order, we also email you when your batch enters production. Can’t find the email? Write to us with the address you ordered with. If a package is lost or arrives damaged, tell us within 14 days so we can take it up with the carrier.',
    links: [{ to: '/contact', label: 'Ask about an order' }],
  },
  {
    title: 'Cancel a pre-order',
    text: 'You can cancel any time before your order ships, for any reason, for a full refund to your original payment method. Email team@spongehydration.com with your order number and we issue the refund within 7 business days.',
    links: [{ to: '/legal/pre-order', label: 'Pre-Order Policy' }],
  },
  {
    title: 'Return it',
    text: 'Not for you? You have 30 days from delivery to return it for a full refund. Email us with your order number and we send a prepaid label for returns within the U.S.',
    links: [{ to: '/legal/returns', label: 'Return Policy' }],
  },
  {
    title: 'Make a warranty claim',
    text: 'Every Sponge has a 1-year limited warranty against manufacturing defects from the date of delivery. If yours stops working because of a defect, email us with your order number and a short description (a photo or video of the problem helps) and we will repair or replace it at no cost.',
    links: [{ to: '/legal/warranty', label: 'Warranty Policy' }],
  },
  {
    title: 'Privacy and your data',
    text: 'To see, correct or delete the information we hold about you, email team@spongehydration.com with the words “privacy request”. You can switch off advertising sharing yourself, any time, from the Privacy Policy page.',
    links: [
      { to: '/legal/privacy', label: 'Privacy Policy' },
      { to: '/legal/terms', label: 'Terms of Service' },
    ],
  },
]

// Only checks the setup guide and tutorials already describe.
const QUICK_CHECKS = [
  'Charge the Sponge over USB-C.',
  'Turn on Bluetooth, and make sure the Sponge app is open and up to date.',
  'Check the magnetic mount is centered and firmly pressed onto the bottom of the bottle, and that the Sponge has snapped onto it.',
  'Set the bottle down on a flat surface after you drink. Sponge takes its reading each time the bottle lands.',
]

export default function Support() {
  return (
    <>
      <Seo
        title="Customer Support | Sponge Hydration"
        description="Get help with your Sponge: setup and tutorials, order tracking, cancelling a pre-order, 30-day returns, warranty claims and privacy requests. Email team@spongehydration.com."
        path="/support"
      />
      <section className="section">
        <div className="container">
          <SectionHead eyebrow="Support" title="How can we help?" as="h1">
            Most answers are one click away. If yours is not, email{' '}
            <a href="mailto:team@spongehydration.com">team@spongehydration.com</a> and a person on
            the Sponge team will reply within one business day.
          </SectionHead>

          <div className="features support-topics">
            {TOPICS.map((t) => (
              <article className="feature support-topic" key={t.title}>
                <h2>{t.title}</h2>
                <p>{t.text}</p>
                <div className="support-topic__links">
                  {t.links.map((l) => (
                    <Link key={l.to} to={l.to} className="feature__more">{l.label} →</Link>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--tint">
        <div className="container support-split">
          <div>
            <h2 className="support-h2">Before you write: quick checks</h2>
            <p className="support-lead">If your Sponge is not logging sips, start with these.</p>
            <ul className="checklist">
              {QUICK_CHECKS.map((c) => (
                <li key={c}><span className="tick">✓</span> {c}</li>
              ))}
            </ul>
            <p className="support-lead">
              Still stuck? The <Link to="/how-it-works#faq">FAQ</Link> covers battery, accuracy,
              bottles, App Lock and Apple Health.
            </p>
          </div>
          <aside className="support-contact">
            <h2 className="support-h2">Contact us</h2>
            <p><strong>Email</strong><br /><a href="mailto:team@spongehydration.com">team@spongehydration.com</a></p>
            <p><strong>Hours</strong><br />Mon–Fri, 9am–6pm ET. We reply within one business day.</p>
            <p><strong>Help us help you</strong><br />Include your order number and the email address you ordered with.</p>
            <Link to="/contact" className="btn btn--primary btn--lg btn--block">Send us a message</Link>
          </aside>
        </div>
      </section>
    </>
  )
}
