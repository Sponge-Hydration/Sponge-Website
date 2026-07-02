import { Link } from 'react-router-dom'
import { useSEO } from '../components/useSEO'
import { Stars, SectionHead } from '../components/bits'
import { testimonials } from '../data'

const features = [
  { icon: '💧', title: 'Automatic sip tracking', text: 'On-device sensors log every sip the moment you drink — no buttons, no manual logging, no guessing how much water you’ve had.' },
  { icon: '🧲', title: 'Clips to any bottle', text: 'A magnetic clip snaps onto the bottle you already own, from insulated steel to glass tumblers. No proprietary bottle to replace.' },
  { icon: '🔋', title: '8-day battery', text: 'Go a full week-plus between charges, then top up in a couple of hours over USB-C. Charge it Sunday, forget about it.' },
  { icon: '📱', title: 'Free iOS & Android app', text: 'Your hydration syncs automatically to a clean dashboard with daily goals, streaks, and trends you can actually act on.' },
  { icon: '🔒', title: 'App-lock motivation', text: 'Choose the apps that distract you and Sponge keeps them locked until you hit your water goal. Hydration with real follow-through.' },
  { icon: '🎯', title: 'Personalized goals', text: 'Goals adapt to your body, activity, and climate, so your target reflects what you actually need — not a generic 8 glasses.' },
]

export default function Home() {
  useSEO({
    title: 'Sponge Hydration Tracker | Smart Water Intake Tracker for Any Bottle',
    description:
      'Sponge is a smart hydration tracker that clips onto any water bottle and automatically tracks your water intake. Logs every sip, syncs to the app, and locks distracting apps until you hit your goal. 8-day battery. Pre-order $59.99.',
    path: '/',
  })

  return (
    <>
      {/* Hero */}
      <section className="hero" id="top">
        <div className="container hero__grid">
          <div>
            <span className="eyebrow">★ 4.9/5 from 120+ early customers</span>
            <h1>The smart <span className="accent">hydration tracker</span> for any water bottle</h1>
            <p className="hero__sub">
              Sponge is a clip-on hydration tracking device that automatically tracks your
              water intake — every sip, from the bottle you already own. Clip it on, drink, and let
              the app keep you on track to your daily goal.
            </p>
            <div className="hero__cta">
              <Link to="/products" className="btn btn--primary btn--lg">Order Sponge — $59.99</Link>
              <a href="#how" className="btn btn--ghost btn--lg">See how it works</a>
            </div>
            <div className="hero__rating">
              <Stars />
              <span>Rated 4.9/5 · 30-day money-back guarantee</span>
            </div>
            <div className="hero__note">
              <span><i className="dot" />Works with any bottle</span>
              <span><i className="dot" />8-day battery</span>
              <span><i className="dot" />Free iOS &amp; Android app</span>
            </div>
          </div>

          <div className="hero__media">
            <video className="hero__video" autoPlay muted loop playsInline poster="/media/video/hero-poster.jpg">
              <source src="/media/video/hero.mp4" type="video/mp4" />
            </video>
            <div className="hero__pill"><i className="dot" />Tracking sips</div>
            <div className="hero__stat"><strong>1.4L</strong><span>today · 78% of goal</span></div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="trust">
        <div className="container trust__grid">
          <div><div className="trust__num">4.9★</div><div className="trust__lbl">Average rating</div></div>
          <div><div className="trust__num">120+</div><div className="trust__lbl">Happy customers</div></div>
          <div><div className="trust__num">8 days</div><div className="trust__lbl">Battery life</div></div>
          <div><div className="trust__num">Any</div><div className="trust__lbl">Water bottle</div></div>
        </div>
      </section>

      {/* Product showcase */}
      <section className="section">
        <div className="container">
          <SectionHead eyebrow="Meet Sponge" title="One tracker. Every sip, counted.">
            Sponge clips onto the bottle you already carry and quietly logs your hydration all day long.
          </SectionHead>
          <div className="showcase">
            <video
              className="showcase__video"
              autoPlay
              muted
              loop
              playsInline
              poster="/media/video/device-anim-poster.jpg"
            >
              <source src="/media/video/device-anim.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="section section--tint">
        <div className="container section-head">
          <span className="eyebrow">The problem</span>
          <h2>Most people are dehydrated — and don’t even know it</h2>
          <p>
            Reminders get ignored. Manual water-tracking apps get abandoned in a week. And smart
            bottles force you to ditch the bottle you love. Hydration shouldn’t take willpower — it
            should just happen. That’s exactly what Sponge does.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="section" id="how">
        <div className="container">
          <SectionHead eyebrow="How it works" title="Clip, sip, repeat">
            A genuinely passive hydration tracker. Three steps, then it disappears into your day.
          </SectionHead>
          <div className="steps">
            <div className="step step--media">
              <img className="step__img" src="/media/how/step1-snap.jpg" alt="Sponge tracker clipped onto a water bottle" />
              <div className="step__body"><div className="step__n">1</div><h3>Clip it on</h3><p>Clip Sponge magnetically onto any water bottle in seconds. No new bottle, no setup ritual.</p></div>
            </div>
            <div className="step step--media">
              <img className="step__img" src="/media/how/step2-sip.jpg" alt="Drinking from a bottle with Sponge during a workout" />
              <div className="step__body"><div className="step__n">2</div><h3>Sip like normal</h3><p>Drink the way you already do. Sponge’s sensors automatically record every sip — zero logging.</p></div>
            </div>
            <div className="step step--media">
              <img className="step__img step__img--app" src="/media/how/step3-app.png" alt="Sponge app showing hydration progress" />
              <div className="step__body"><div className="step__n">3</div><h3>Hit your goal</h3><p>The app tracks your intake in real time, nudges you when you fall behind, and celebrates your streaks.</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* Lifestyle band */}
      <section className="lifestyle-band" aria-hidden="true">
        <img src="/media/lifestyle/track.jpg" alt="" />
        <div className="lifestyle-band__overlay">
          <p className="lifestyle-band__quote">Hydration that keeps up with you — on the track, at the desk, everywhere.</p>
        </div>
      </section>

      {/* Features */}
      <section className="section" id="features">
        <div className="container">
          <SectionHead eyebrow="Features" title="Everything a hydration tracking device should be">
            Effortless to use, impossible to forget, and built around the bottle you already carry.
          </SectionHead>
          <div className="features">
            {features.map((f) => (
              <article className="feature" key={f.title}>
                <div className="feature__icon" aria-hidden="true">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* App-lock split */}
      <section className="section section--tint">
        <div className="container split">
          <div className="split__media">
            <img className="appshot" src="/media/app/applock.png" alt="Sponge app locking Facebook until a hydration goal is reached" />
          </div>
          <div>
            <span className="eyebrow">The hydration hack for your phone</span>
            <h2 style={{ fontSize: 'clamp(26px,3.6vw,38px)', fontWeight: 800, margin: '16px 0 14px' }}>
              Turn your phone into a reason to drink water
            </h2>
            <p style={{ color: 'var(--ink-soft)', fontSize: 18, margin: '0 0 8px' }}>
              Sponge’s app can lock the apps that distract you most until you reach your daily
              hydration goal. It’s the accountability a normal water tracker can’t give you — and it
              actually works.
            </p>
            <ul className="checklist">
              <li><span className="tick">✓</span> Pick which apps to gate behind your water goal</li>
              <li><span className="tick">✓</span> Real-time progress unlocks them as you drink</li>
              <li><span className="tick">✓</span> Build a lasting hydration habit, not a one-week streak</li>
            </ul>
            <div style={{ marginTop: 26, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/products" className="btn btn--primary btn--lg">Order Sponge</Link>
              <Link to="/dashboard" className="btn btn--ghost btn--lg">See the dashboard</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Personas */}
      <section className="section" id="who">
        <div className="container">
          <SectionHead eyebrow="Who it’s for" title="Built for anyone who keeps forgetting to drink water">
            One simple hydration tracker, a lot of people it quietly helps every day.
          </SectionHead>
          <div className="personas">
            <article className="persona"><div className="persona__emoji">🏃</div><h3>Athletes &amp; active people</h3><p>Dial in hydration around training and recovery with accurate, automatic intake data you can trust.</p></article>
            <article className="persona"><div className="persona__emoji">💼</div><h3>Busy professionals</h3><p>Back-to-back days make it easy to forget to drink. Sponge tracks for you and nudges before you fall behind.</p></article>
            <Link to="/caregivers" className="persona"><div className="persona__emoji">🩺</div><h3>Caregivers &amp; families</h3><p>Keep an eye on a loved one’s hydration with effortless tracking and shared progress. See our caregiver program →</p></Link>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="section section--tint" id="reviews">
        <div className="container">
          <SectionHead eyebrow="Reviews" title="Loved by 120+ early customers">
            Rated 4.9 out of 5. Here’s what people say after switching to a hands-free hydration tracker.
          </SectionHead>
          <div className="tcards">
            {testimonials.map((t) => (
              <article className="tcard" key={t.name}>
                <Stars small />
                <p>“{t.quote}”</p>
                <div className="tcard__who">
                  <div className="tcard__av">{t.initial}</div>
                  <div><strong>{t.name}</strong><span>{t.loc}</span></div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="section">
        <div className="container">
          <div className="cta-band">
            <h2>Stop guessing. Start tracking.</h2>
            <p>Join 120+ people building a real hydration habit with the clip-on tracker that works with any bottle.</p>
            <Link to="/products" className="btn btn--ghost btn--lg">Order Sponge — $59.99</Link>
          </div>
        </div>
      </section>

      {/* SEO prose */}
      <section className="section section--tint">
        <div className="container prose">
          <h2>The hydration tracker that fits your life</h2>
          <p>
            Sponge is a smart <strong>hydration tracker</strong> and clip-on <strong>hydration
            tracking device</strong> designed to make drinking enough water effortless. Instead of
            relying on reminders you ignore or a manual <strong>water intake tracker</strong> app you
            abandon, Sponge measures every sip automatically and syncs it to your phone. It’s the
            hands-free <strong>water tracking device</strong> that finally turns hydration into a habit.
          </p>
          <h3>Works with the water bottle you already own</h3>
          <p>
            Unlike a smart water bottle that forces you to replace your favorite tumbler, Sponge’s
            magnetic clip attaches to virtually any bottle — insulated steel, plastic, or glass. That
            makes it one of the most flexible <strong>automatic hydration trackers</strong> you can buy:
            keep your bottle, add the tracking.
          </p>
          <h3>A daily water tracker that motivates you</h3>
          <p>
            The free Sponge app is more than a <strong>daily water tracker</strong>. With personalized
            goals and an optional app-lock feature, it gives you real accountability. Whether you’re an
            athlete fine-tuning recovery, a busy professional who forgets to drink, or a caregiver
            monitoring a loved one, Sponge is the <strong>sip tracker</strong> and <strong>drink-water
            reminder device</strong> that actually changes behavior.
          </p>
        </div>
      </section>
    </>
  )
}
