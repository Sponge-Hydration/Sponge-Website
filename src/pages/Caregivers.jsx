import { Link } from 'react-router-dom'
import { useSEO } from '../components/useSEO'
import { SectionHead } from '../components/bits'

export default function Caregivers() {
  useSEO({
    title: 'Sponge for Caregivers | Remote Hydration Monitoring for Loved Ones',
    description:
      'Help an aging parent or loved one stay hydrated. The Sponge caregiver program tracks their water intake automatically and alerts you if they fall behind — no app skills required on their end.',
    path: '/caregivers',
  })

  return (
    <>
      <section className="hero hero--sub">
        <div className="container">
          <span className="eyebrow">For caregivers</span>
          <h1>Peace of mind that your loved one is drinking enough</h1>
          <p className="hero__sub">
            Dehydration is one of the most common — and most preventable — reasons older adults end up
            in the hospital. Sponge lets you monitor a loved one’s hydration remotely, automatically,
            without asking them to learn an app or log a thing.
          </p>
          <div className="hero__cta">
            <Link to="/shop/p/sponge-family-pack" className="btn btn--primary btn--lg">Get the Family Pack</Link>
            <Link to="/contact" className="btn btn--ghost btn--lg">Talk to our care team</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHead eyebrow="How it helps" title="Hydration monitoring that respects their independence">
            They keep their normal bottle and routine. You get visibility and alerts.
          </SectionHead>
          <div className="features">
            <article className="feature"><div className="feature__icon">👀</div><h3>Remote visibility</h3><p>See your loved one’s daily intake from your own phone, wherever you are. No need to call and ask.</p></article>
            <article className="feature"><div className="feature__icon">🔔</div><h3>Low-hydration alerts</h3><p>Get notified if they’re falling behind their goal so you can send a gentle reminder in time.</p></article>
            <article className="feature"><div className="feature__icon">🧓</div><h3>Zero learning curve</h3><p>They just drink from their usual bottle. Nothing to set up, charge daily, or remember.</p></article>
            <article className="feature"><div className="feature__icon">👨‍👩‍👧</div><h3>Shared family dashboard</h3><p>Multiple family members can follow along and split the caregiving load.</p></article>
            <article className="feature"><div className="feature__icon">📈</div><h3>Trends over time</h3><p>Spot patterns — like dips on hot days — and share clear data with their doctor.</p></article>
            <article className="feature"><div className="feature__icon">🛡️</div><h3>Private & secure</h3><p>Data is shared only with the family members you invite. You stay in control.</p></article>
          </div>
        </div>
      </section>

      <section className="section section--deep">
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(26px,4vw,38px)', fontWeight: 800, marginBottom: 14 }}>
            Caring for someone? Start with the Family Pack
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', maxWidth: 560, margin: '0 auto 24px' }}>
            Four trackers and a shared dashboard so the whole family can help keep a loved one hydrated.
          </p>
          <Link to="/shop/p/sponge-family-pack" className="btn btn--ghost btn--lg">Shop the Family Pack — $199.99</Link>
        </div>
      </section>
    </>
  )
}
