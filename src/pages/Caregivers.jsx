import { Link } from 'react-router-dom'
import { Seo } from '../components/useSEO'
import { SectionHead } from '../components/bits'
import { EyeIcon, BellIcon, SparklesIcon, UsersIcon, TrendingUpIcon, ShieldIcon } from '../components/icons'

export default function Caregivers() {
  return (
    <>
      <Seo
        title="Sponge for Caregivers | Remote Hydration Monitoring for Loved Ones"
        description="Help an aging parent or loved one stay hydrated. The Sponge caregiver program tracks their water intake automatically and alerts you if they fall behind, no app skills required on their end."
        path="/caregivers"
      />
      <section className="hero hero--sub">
        <div className="container">
          <span className="eyebrow">For caregivers</span>
          <h1>Peace of mind that your loved one is drinking enough</h1>
          <p className="hero__sub">
            Not drinking enough is common in older adults and easy to miss — and older people who
            arrive in hospital dehydrated do measurably worse than those who don’t.<sup><a href="#src-1">1</a></sup>{' '}
            Sponge lets you see a loved one’s intake from your own phone, without asking them to
            learn an app or log a thing.
          </p>
          <p className="hero__disclaimer">
            Sponge is a general wellness product. It is not a medical device, it does not diagnose,
            treat or prevent any condition, and it is not a substitute for medical care.
          </p>
          <div className="hero__cta">
            <Link to="/shop/p/sponge-family-pack" className="btn btn--primary btn--lg">Get the Family Pack</Link>
            <Link to="/contact" className="btn btn--ghost btn--lg">Talk to our care team</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <img className="about-banner" src="/media/lifestyle/caregiver.jpg" alt="Sponge tracker on a water bottle within easy reach at home" />
        </div>
      </section>

      <section className="section section--tint">
        <div className="container">
          <SectionHead eyebrow="How it helps" title="Hydration monitoring that respects their independence">
            They keep their normal bottle and routine. You get visibility and alerts.
          </SectionHead>
          <div className="features">
            <article className="feature"><div className="feature__icon" aria-hidden="true"><EyeIcon size={30} /></div><h3>Remote visibility</h3><p>See your loved one’s daily intake from your own phone, wherever you are. No need to call and ask.</p></article>
            <article className="feature"><div className="feature__icon" aria-hidden="true"><BellIcon size={30} /></div><h3>Behind-goal alerts</h3><p>Get notified when they’re behind the daily goal they set, so you can check in. It tracks drinking, not health — it won’t tell you anything clinical.</p></article>
            <article className="feature"><div className="feature__icon" aria-hidden="true"><SparklesIcon size={30} /></div><h3>Zero learning curve</h3><p>They just drink from their usual bottle. Nothing to set up, charge daily, or remember.</p></article>
            <article className="feature"><div className="feature__icon" aria-hidden="true"><UsersIcon size={30} /></div><h3>Shared family dashboard</h3><p>Multiple family members can follow along and split the caregiving load.</p></article>
            <article className="feature"><div className="feature__icon" aria-hidden="true"><TrendingUpIcon size={30} /></div><h3>Trends over time</h3><p>Spot patterns, like dips on hot days, and share clear data with their doctor.</p></article>
            <article className="feature"><div className="feature__icon" aria-hidden="true"><ShieldIcon size={30} /></div><h3>Private & secure</h3><p>Data is shared only with the family members you invite. You stay in control.</p></article>
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

      <section className="section">
        <div className="container">
          <ol className="sources" id="sources">
            <li id="src-1">
              Hydration and outcome in older patients admitted to hospital (the HOOP prospective
              cohort study), <em>Age and Ageing</em>, vol. 44 no. 6 (2015).{' '}
              <a href="https://academic.oup.com/ageing/article/44/6/943/80322" target="_blank" rel="noopener noreferrer">
                Read the study
              </a>
              . In that cohort dehydration was present in 8.9% of older emergency admissions and was
              the primary cause in 0.6%; 30-day mortality was 17% among those admitted with
              dehydration against 7% without. We cite it for the outcome gap, not to claim
              dehydration is a leading cause of admission — it isn’t.
            </li>
          </ol>
        </div>
      </section>
    </>
  )
}
