import { Link, useParams } from 'react-router-dom'
import { Seo } from '../components/useSEO'

const PAGES = {
  terms: {
    title: 'Terms of Service',
    updated: 'August 2026',
    body: [
      'These terms govern your use of the Sponge website and products. By placing an order you agree to them.',
      'Sponge is currently sold as a pre-order. Pre-orders are charged at the time of purchase, do not carry a committed delivery date, and may be cancelled by you for a full refund at any time before your device ships. Full terms are in our Pre-Order Policy.',
      'Sponge devices and the companion app are provided for general wellness and hydration tracking. They are not medical devices and should not be used to diagnose or treat any condition.',
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    updated: 'June 2026',
    body: [
      'We respect your privacy. We collect only the information needed to fulfill your order and operate the Sponge app, such as your name, contact details, and hydration data.',
      'Hydration data is associated with your account and shared only with the family members or caregivers you explicitly invite. We never sell your personal data.',
      'You can request access to, or deletion of, your data at any time by contacting team@spongehydration.com.',
    ],
  },
  'pre-order': {
    title: 'Pre-Order Policy',
    updated: 'August 2026',
    body: [
      'Sponge is currently sold as a pre-order. We manufacture in production batches, and a batch is built once enough pre-orders are reserved to fill one. Because of that, we do not commit to a delivery date when you order. We would rather tell you that plainly than give you a date we cannot stand behind.',
      'Your card is charged when you place a pre-order. Pre-order payments are what fund the production run your device comes from. In exchange, the price you pay is locked — if our pricing changes before your batch ships, you still pay what you paid on the day you ordered.',
      'You may cancel a pre-order at any time before it ships, for any reason, and receive a full refund to your original payment method. Email team@spongehydration.com with your order number. Refunds are issued within 7 business days of your request.',
      'We will email you when your batch enters production, and again with tracking when your device ships. If we decide not to produce a batch you have reserved, we will cancel your order and refund you in full without you needing to ask.',
      'Hardware specifications, colour, finish, and packaging may change in minor ways between pre-order and production. If we make a change that materially reduces what the device does, we will tell you before it ships and you may cancel for a full refund.',
      'Once your Sponge is delivered, our 30-day money-back guarantee and 1-year limited warranty apply from the delivery date. See the Return Policy and Warranty Policy for those terms.',
    ],
  },
  returns: {
    title: 'Return Policy',
    updated: 'August 2026',
    body: [
      'Every Sponge comes with a 30-day money-back guarantee. If you’re not happy, contact us within 30 days of delivery for a full refund.',
      'To start a return, email team@spongehydration.com with your order number. We’ll send a prepaid label for items being returned within the U.S.',
      'Refunds are issued to your original payment method once the device is received and inspected.',
      'This guarantee applies from the date your device is delivered. If you have placed a pre-order that has not shipped yet, you are not waiting on this policy — you can cancel outright for a full refund at any time. See our Pre-Order Policy.',
    ],
  },
  warranty: {
    title: 'Warranty Policy',
    updated: 'June 2026',
    body: [
      'Sponge devices are covered by a 1-year limited warranty against manufacturing defects from the date of delivery.',
      'If your device stops working due to a defect, contact team@spongehydration.com and we’ll repair or replace it at no cost.',
      'The warranty does not cover damage from misuse, accidents, or unauthorized modification.',
    ],
  },
}

export default function Legal() {
  const { doc } = useParams()
  const page = PAGES[doc]

  if (!page) {
    return (
      <section className="section">
        <Seo title="Not found | Sponge" description="Page not found." path={`/legal/${doc || ''}`} noindex />
        <div className="container empty-state">
          <h2>Page not found</h2>
          <Link to="/" className="btn btn--primary">Back home</Link>
        </div>
      </section>
    )
  }

  return (
    <section className="section">
      <Seo title={`${page.title} | Sponge Hydration`} description={`${page.title} for Sponge Hydration.`} path={`/legal/${doc}`} />
      <div className="container prose">
        <h1 style={{ fontSize: 34, fontWeight: 800, marginBottom: 8 }}>{page.title}</h1>
        <p style={{ color: 'var(--muted)', marginBottom: 24 }}>Last updated {page.updated}</p>
        {page.body.map((p, i) => <p key={i}>{p}</p>)}
        <p style={{ marginTop: 24 }}>
          Questions? <Link to="/contact" className="link-btn" style={{ display: 'inline' }}>Contact us</Link>.
        </p>
      </div>
    </section>
  )
}
