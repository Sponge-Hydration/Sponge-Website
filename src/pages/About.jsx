import { Link } from 'react-router-dom'
import { useSEO } from '../components/useSEO'
import { SectionHead } from '../components/bits'

export default function About() {
  useSEO({
    title: 'About Sponge | Why We Built a Smarter Hydration Tracker',
    description:
      'Sponge was founded to make hydration effortless. Learn our story and mission to help people drink more water with a clip-on hydration tracking device that works with any bottle.',
    path: '/about',
  })

  return (
    <>
      <section className="hero hero--sub">
        <div className="container">
          <span className="eyebrow">Our story</span>
          <h1>We think hydration should be effortless</h1>
          <p className="hero__sub">
            Sponge started with a simple frustration: every hydration product asked us to do more —
            log water by hand, buy a new bottle, remember to drink. We wanted the opposite. A tracker
            that disappears into your day and just works.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container prose">
          <h2>Our mission</h2>
          <p>
            Chronic mild dehydration is one of the most common and overlooked health issues — and the
            fixes on the market all rely on willpower. We set out to build a hydration tracker that
            removes the friction entirely: no logging, no new bottle, no nagging you can tune out.
          </p>
          <h3>Built around the bottle you already love</h3>
          <p>
            Instead of locking the sensor inside a single bottle, we put it in a tiny clip that works
            with the bottle you already carry. That one decision makes Sponge flexible enough to fit
            any routine — at your desk, in the gym bag, or in a parent’s kitchen.
          </p>
          <h3>Behavior, not just data</h3>
          <p>
            Tracking is only useful if it changes what you do. That’s why the Sponge app pairs gentle,
            real-time nudges with an optional app-lock that turns your phone into a reason to drink.
            The result is a habit that actually sticks.
          </p>
        </div>
      </section>

      <section className="section section--tint">
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(24px,3.4vw,34px)', fontWeight: 800, marginBottom: 14 }}>Meet the people building Sponge</h2>
          <Link to="/team" className="btn btn--primary btn--lg">See the team</Link>
        </div>
      </section>
    </>
  )
}
