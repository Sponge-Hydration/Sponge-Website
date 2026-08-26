import { Link, useNavigate } from 'react-router-dom'
import { Seo } from '../components/useSEO'
import { SectionHead } from '../components/bits'
import Reviews from '../components/Reviews'
import { useCart } from '../cart/CartContext'
import { DropletIcon, MagnetIcon, BatteryIcon, PhoneIcon, LockIcon, TargetIcon } from '../components/icons'

const features = [
  { icon: DropletIcon, title: 'Automatic sip tracking', text: 'On-device sensors log every sip the moment you drink, no buttons, no manual logging, no guessing how much water you’ve had.' },
  { icon: MagnetIcon, title: 'Clips to any bottle', text: 'A magnetic clip snaps onto the bottle you already own, from insulated steel to glass tumblers. No proprietary bottle to replace.' },
  { icon: BatteryIcon, title: '8-day battery', text: 'Go a full week-plus between charges, then top up in a couple of hours over USB-C. Charge it Sunday, forget about it.' },
  { icon: PhoneIcon, title: 'Free iOS & Android app', text: 'Your hydration syncs automatically to a clean dashboard with daily goals, streaks, and trends you can actually act on.' },
  { icon: LockIcon, title: 'App-lock motivation', text: 'Choose the apps that distract you and Sponge keeps them locked until you hit your water goal. Hydration with real follow-through.' },
  { icon: TargetIcon, title: 'Personalized goals', text: 'Goals adapt to your body, activity, and climate, so your target reflects what you actually need, not a generic 8 glasses.' },
]

export default function Home() {
  const { add } = useCart()
  const navigate = useNavigate()
  // One-click: drop a single Sponge in the cart and go straight to checkout.
  const checkoutSingle = () => {
    add('sponge-clip', 1)
    navigate('/checkout')
  }
  return (
    <>
      <Seo
        title="Sponge Hydration Tracker | Smart Water Intake Tracker for Any Bottle"
        description="Sponge is a smart hydration tracker that clips onto any water bottle and automatically tracks your water intake. Logs every sip, syncs to the app, and locks distracting apps until you hit your goal. 8-day battery. Pre-order $59.99."
        path="/"
      />
      {/* Hero */}
      <section className="hero" id="top">
        <div className="container hero__grid">
          <div>
            <span className="eyebrow">Pre-order · Cancel any time before it ships</span>
            <h1>The smart <span className="accent">hydration tracker</span> for any water bottle</h1>
            <p className="hero__sub">
              Sponge is a clip-on hydration tracking device that automatically tracks your
              water intake, every sip, from the bottle you already own. Clip it on, drink, and let
              the app keep you on track to your daily goal.
            </p>
            <div className="hero__cta">
              <Link to="/products" className="btn btn--primary btn--lg">Pre-order Sponge</Link>
              <a href="#how" className="btn btn--ghost btn--lg">See how it works</a>
            </div>
            <div className="hero__rating">
              <span>$59.99 + shipping &amp; tax · Ships to the US · 30-day money-back guarantee</span>
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
          <div><div className="trust__num">120+</div><div className="trust__lbl">Happy customers</div></div>
          <div><div className="trust__num">30-day</div><div className="trust__lbl">Money-back guarantee</div></div>
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
          <div className="showcase showcase--photo">
            <img
              className="showcase__img"
              src="/media/lifestyle/showcase-centered.webp"
              alt="Sponge trackers clipped onto an Owala and a Nalgene water bottle on the grass, next to Sponge packaging."
              width="800"
              height="936"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="section section--tint">
        <div className="container section-head">
          <span className="eyebrow">The problem</span>
          <h2>Most people are dehydrated, and don’t even know it</h2>
          <p>
            Reminders get ignored. Manual water-tracking apps get abandoned in a week. And smart
            bottles start around $80 and force you to ditch the bottle you love. Sponge is $59.99
            and clips onto the one you already own. Hydration shouldn’t take willpower, it should
            just happen. That’s exactly what Sponge does.
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
              <img className="step__img" style={{ objectPosition: '50% 72%' }} src="/media/how/step1-snap.jpg" alt="Setting a bottle down with the Sponge tracker attached underneath, status light glowing" />
              <div className="step__body"><div className="step__n">1</div><h3>Clip it on</h3><p>Clip Sponge magnetically onto any water bottle in seconds. No new bottle, no setup ritual.</p></div>
            </div>
            <div className="step step--media">
              <img className="step__img" style={{ objectPosition: '50% 58%' }} src="/media/how/step2-sip.jpg" alt="Drinking from a bottle with the Sponge tracker attached, courtside" />
              <div className="step__body"><div className="step__n">2</div><h3>Sip like normal</h3><p>Drink the way you already do. Sponge’s sensors automatically record every sip, zero logging.</p></div>
            </div>
            <div className="step step--media">
              <img className="step__img step__img--app" src="/media/how/step3-graph.webp" alt="Sponge app showing hydration progress" />
              <div className="step__body"><div className="step__n">3</div><h3>Hit your goal</h3><p>The app tracks your intake in real time, nudges you when you fall behind, and celebrates your streaks.</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* Lifestyle band */}
      {/* aria-hidden belongs on the decorative photo only — putting it on the
          section also hid the visible headline from screen readers. */}
      <section className="lifestyle-band">
        {/* Replaced recovery.webp, which shipped with a visible AI-generation
            watermark and a competitor's bottle as its subject. This is a real
            photo of a Sponge-branded bottle with the tracker lit at its base. */}
        <img src="/media/lifestyle/desk.jpg" alt="" aria-hidden="true" style={{ objectPosition: 'center 70%' }} />
        <div className="lifestyle-band__overlay">
          <p className="lifestyle-band__quote">Hydration that keeps up with you, on the court, at the desk, everywhere.</p>
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
                <div className="feature__icon" aria-hidden="true"><f.icon size={30} /></div>
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
            <img className="appshot" src="/media/app/applock.webp" alt="Sponge app locking Facebook until a hydration goal is reached" />
          </div>
          <div>
            <span className="eyebrow">The hydration hack for your phone</span>
            <h2 style={{ fontSize: 'clamp(26px,3.6vw,38px)', fontWeight: 800, margin: '16px 0 14px' }}>
              Turn your phone into a reason to drink water
            </h2>
            <p style={{ color: 'var(--ink-soft)', fontSize: 18, margin: '0 0 8px' }}>
              Sponge’s app can lock the apps that distract you most until you reach your daily
              hydration goal. It’s the accountability a normal water tracker can’t give you, and it
              actually works.
            </p>
            <ul className="checklist">
              <li><span className="tick">✓</span> Pick which apps to gate behind your water goal</li>
              <li><span className="tick">✓</span> Real-time progress unlocks them as you drink</li>
              <li><span className="tick">✓</span> Build a lasting hydration habit, not a one-week streak</li>
            </ul>
            <div style={{ marginTop: 26, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/products" className="btn btn--primary btn--lg">Sponge Up</Link>
            </div>
            <div className="app-badges">
              <a href="https://apps.apple.com/us/app/sponge-hydration/id6566195232" target="_blank" rel="noopener noreferrer">
                 Download on the App Store
              </a>
              <a href="https://play.google.com/store/apps/details?id=com.spongehydrationAndroid.sponge" target="_blank" rel="noopener noreferrer">
                ▶ Get it on Google Play
              </a>
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
            <article className="persona">
              <img className="persona__img" src="/media/personas/athlete.jpg" alt="Two friends playing basketball at an outdoor court" loading="lazy" />
              <div className="persona__body"><h3>Athletes &amp; active people</h3><p>Dial in hydration around training and recovery with accurate, automatic intake data you can trust.</p></div>
            </article>
            <article className="persona">
              <img className="persona__img" style={{ objectPosition: '50% 70%' }} src="/media/personas/professional.jpg" alt="Water bottles with the Sponge tracker on a sunny kitchen counter" loading="lazy" />
              <div className="persona__body"><h3>Busy professionals</h3><p>Back-to-back days make it easy to forget to drink. Sponge tracks for you and nudges before you fall behind.</p></div>
            </article>
            <Link to="/caregivers" className="persona">
              <img className="persona__img" src="/media/personas/caregiver.jpg" alt="Adult daughter with her mother and a tracked water bottle at home" loading="lazy" />
              <div className="persona__body"><h3>Caregivers &amp; families</h3><p>Keep an eye on a loved one’s hydration with effortless tracking and shared progress. See our caregiver program →</p></div>
            </Link>
          </div>
        </div>
      </section>

      {/* Reviews, live from Airtable, hidden when empty */}
      <Reviews />

      {/* CTA band */}
      <section className="section">
        <div className="container">
          <div className="cta-band">
            <h2>Stop guessing. Start tracking.</h2>
            <p>Join 120+ people building a real hydration habit with the clip-on tracker that works with any bottle.</p>
            <button type="button" className="btn btn--ghost btn--lg" onClick={checkoutSingle}>Pre-order Sponge — $59.99</button>
            <p className="cta-band__note">
              $59.99 + shipping &amp; tax · Cancel any time before it ships · 30 days to change
              your mind once it arrives, and we pay return shipping
            </p>
          </div>
        </div>
      </section>

      {/* Comparison — replaces a keyword-stuffed SEO block with something that
          answers the question people actually arrive with. */}
      <section className="section section--tint" id="compare">
        <div className="container">
          <SectionHead eyebrow="How it compares" title="Four ways to drink more water">
            Three of these already exist in your life and haven’t worked. Here’s the honest
            difference.
          </SectionHead>

          <div className="compare-wrap">
            <table className="compare">
              <caption className="sr-only">
                Sponge compared with a reminder app, a smart bottle, and a clip-on reminder
              </caption>
              <thead>
                <tr>
                  <th scope="col">
                    <span className="compare__sr">Approach</span>
                  </th>
                  <th scope="col">A reminder app</th>
                  <th scope="col">A smart bottle</th>
                  <th scope="col">A clip-on reminder</th>
                  <th scope="col" className="compare__us">Sponge</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Roughly what it costs</th>
                  <td>Free</td>
                  <td>Around $80 and up</td>
                  <td>Around $30</td>
                  <td className="compare__us">$59.99</td>
                </tr>
                <tr>
                  <th scope="row">Keep the bottle you own</th>
                  <td className="yes">Yes</td>
                  <td className="no">No — it replaces it</td>
                  <td className="yes">Yes</td>
                  <td className="compare__us yes">Yes</td>
                </tr>
                <tr>
                  <th scope="row">Measures what you actually drink</th>
                  <td className="no">No — you log it by hand</td>
                  <td className="yes">Yes</td>
                  <td className="no">No — it only reminds you</td>
                  <td className="compare__us yes">Yes, automatically</td>
                </tr>
                <tr>
                  <th scope="row">Does something when you fall behind</th>
                  <td className="no">Sends a notification</td>
                  <td className="no">Lights up</td>
                  <td className="no">Blinks</td>
                  <td className="compare__us yes">Locks the apps you chose</td>
                </tr>
                <tr>
                  <th scope="row">Still in use after a month</th>
                  <td className="no">Rarely</td>
                  <td>Depends on you</td>
                  <td>Depends on you</td>
                  <td className="compare__us">That’s what App Lock is for</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="compare__note">
            Prices are what these categories typically sell for, not quotes for any one product.
            Want the longer version?{' '}
            <Link to="/blog/smart-bottle-vs-clip-on-tracker">
              We wrote up smart bottles vs clip-on trackers
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Objection handling — the questions people actually stall on. */}
      <section className="section">
        <div className="container">
          <SectionHead eyebrow="Before you buy" title="The honest answers">
            The things worth knowing before you spend $59.99.
          </SectionHead>
          <div className="objections">
            <article className="objection">
              <h3>“I’ll stop using it after a month.”</h3>
              <p>
                Most people do — that’s the entire problem with hydration tracking, and it’s the
                reason App Lock exists. A number you can ignore gets ignored. Apps you can’t open
                until you drink do not.
              </p>
            </article>
            <article className="objection">
              <h3>“Why $59.99 when a reminder clip is $30?”</h3>
              <p>
                Because a reminder clip blinks at you. Sponge measures the water, syncs it, and
                acts on it. If a blinking light is enough for you, genuinely buy the cheaper
                thing — it works for some people.
              </p>
            </article>
            <article className="objection">
              <h3>“It’s a pre-order with no date.”</h3>
              <p>
                True, and we won’t invent one. We build in batches and a batch runs when enough
                pre-orders are reserved to fill it. Your price is locked, and you can{' '}
                <Link to="/legal/pre-order">cancel for a full refund any time before it ships</Link>.
              </p>
            </article>
            <article className="objection">
              <h3>“Does it work with my bottle?”</h3>
              <p>
                It attaches magnetically to the base, so insulated steel, plastic and glass all
                work. The adhesive 3-pack lets you leave a mount on every bottle you use and move
                one tracker between them.
              </p>
            </article>
          </div>
        </div>
      </section>
    </>
  )
}
