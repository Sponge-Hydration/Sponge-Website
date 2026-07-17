import { Link, useParams } from 'react-router-dom'
import { Seo } from '../components/useSEO'

const PAGES = {
  terms: {
    title: 'Terms of Service',
    body: [
      'These terms govern your use of the Sponge website and products. By placing an order you agree to them.',
      'Pre-orders are charged at the time of purchase and ship on the estimated timeline shown at checkout, which may change as production progresses. We’ll keep you updated by email.',
      'Sponge devices and the companion app are provided for general wellness and hydration tracking. They are not medical devices and should not be used to diagnose or treat any condition.',
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    body: [
      'We respect your privacy. We collect only the information needed to fulfill your order and operate the Sponge app, such as your name, contact details, and hydration data.',
      'Hydration data is associated with your account and shared only with the family members or caregivers you explicitly invite. We never sell your personal data.',
      'You can request access to, or deletion of, your data at any time by contacting support@spongehydration.com.',
    ],
  },
  returns: {
    title: 'Return Policy',
    body: [
      'Every Sponge comes with a 30-day money-back guarantee. If you’re not happy, contact us within 30 days of delivery for a full refund.',
      'To start a return, email support@spongehydration.com with your order number. We’ll send a prepaid label for items being returned within the U.S.',
      'Refunds are issued to your original payment method once the device is received and inspected.',
    ],
  },
  warranty: {
    title: 'Warranty Policy',
    body: [
      'Sponge devices are covered by a 1-year limited warranty against manufacturing defects from the date of delivery.',
      'If your device stops working due to a defect, contact support@spongehydration.com and we’ll repair or replace it at no cost.',
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
        <p style={{ color: 'var(--muted)', marginBottom: 24 }}>Last updated June 2026</p>
        {page.body.map((p, i) => <p key={i}>{p}</p>)}
        <p style={{ marginTop: 24 }}>
          Questions? <Link to="/contact" className="link-btn" style={{ display: 'inline' }}>Contact us</Link>.
        </p>
      </div>
    </section>
  )
}
