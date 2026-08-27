import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Seo } from '../components/useSEO'
import { SectionHead } from '../components/bits'
import Reviews from '../components/Reviews'
import { useCart } from '../cart/CartContext'
import { DropletIcon, MagnetIcon, BatteryIcon, PhoneIcon, LockIcon, HeartIcon } from '../components/icons'

const features = [
  { icon: DropletIcon, title: 'Automatic sip tracking', text: 'On-device sensors log every sip the moment you drink, no buttons, no manual logging, no guessing how much water you’ve had.' },
  { icon: MagnetIcon, title: 'Clips to any bottle', text: 'A magnetic clip snaps onto the bottle you already own, from insulated steel to glass tumblers. No proprietary bottle to replace.' },
  { icon: BatteryIcon, title: '8-day battery', text: 'Go a full week-plus between charges, then top up in a couple of hours over USB-C. Charge it Sunday, forget about it.' },
  { icon: PhoneIcon, title: 'Free app, plus a widget', text: 'A clean dashboard with daily goals, streaks and trends — and an iPhone home-screen widget, so most days you never open the app at all.' },
  { icon: LockIcon, title: 'Hydration Locks', text: 'Choose the apps you lose hours to and set what unlocks each one. They stay shut until the water is actually gone.' },
  { icon: HeartIcon, title: 'Syncs to Apple Health', text: 'Your intake writes straight into Apple Health on iPhone, so it sits alongside the rest of your health data instead of stranded in one more app.' },
]

// The hero now plays the real product film: a studio pull-back over the Clip
// itself, cut from assets/videos/playable/clip-vertical-b.mp4. It is ping-ponged
// (forward then reversed) because the source is a reveal, so a hard loop would
// jar — this way it breathes. The device is the subject in every frame.
//
// It replaced footage showing a Hydro Flask on a closed laptop with burned-in
// social captions that demonstrated the Coaster, not the Clip (ledger A-54).
const HERO_VIDEO_ENABLED = true

/**
 * Hero media. A muted 9-second video that autoplays and loops is "moving
 * content that starts automatically and lasts more than five seconds", so WCAG
 * 2.2.2 requires a way to stop it. Two mechanisms, live whenever the video is:
 *  - anyone asking for reduced motion never gets it playing at all; they get
 *    the poster frame, and the file is not fetched;
 *  - everyone else gets a pause/play control over the video.
 */
function HeroBackground() {
  const videoRef = useRef(null)
  const [reduced, setReduced] = useState(false)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const toggle = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play(); setPaused(false) } else { v.pause(); setPaused(true) }
  }

  // The footage is the Clip on pure white, so the layer is composited with
  // mix-blend-mode: multiply — the white drops out and the hero's own gradient
  // shows through, leaving just the device over the brand background.
  if (!HERO_VIDEO_ENABLED || reduced) {
    return (
      <>
        <div className="hero__bg" aria-hidden="true">
          <picture>
            <source media="(max-width: 939px)" srcSet="/media/video/hero-bg-tall.jpg" />
            <img src="/media/video/hero-bg-wide.jpg" alt="" width="1920" height="1080" />
          </picture>
        </div>
        <div className="hero__scrim" aria-hidden="true" />
      </>
    )
  }

  return (
    <>
      <div className="hero__bg" aria-hidden="true">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          poster="/media/video/hero-bg-wide.jpg"
        >
          <source media="(max-width: 939px)" src="/media/video/hero-bg-tall.mp4" type="video/mp4" />
          <source src="/media/video/hero-bg-wide.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="hero__scrim" aria-hidden="true" />
      <button type="button" className="hero__video-toggle" onClick={toggle}>
        {paused ? 'Play' : 'Pause'}
        <span className="sr-only"> background video</span>
      </button>
    </>
  )
}

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
        <HeroBackground />
        <div className="container hero__grid">
          <div className="hero__copy">
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

          <div className="hero__badges" aria-hidden="true">
            <div className="hero__pill"><i className="dot" />Tracking sips</div>
            <div className="hero__stat"><strong>1.4L</strong><span>today · 78% of goal</span></div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="trust">
        <div className="container trust__grid">
          <div><div className="trust__num">100+</div><div className="trust__lbl">Sponge products shipped</div></div>
          <div><div className="trust__num">30-day</div><div className="trust__lbl">Money-back guarantee</div></div>
          <div><div className="trust__num">8 days</div><div className="trust__lbl">Battery life</div></div>
          <div><div className="trust__num">Apple</div><div className="trust__lbl">Health sync on iPhone</div></div>
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
              src="/media/lifestyle/meet-sponge.webp"
              alt="A black Sponge Clip in its open box beside a boxed white one, showing the embossed logo and chrome ring."
              width="1000"
              height="624"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="section section--tint">
        <div className="container section-head">
          <span className="eyebrow">The problem</span>
          <h2>You already know you should drink more water</h2>
          <p>
            That’s the problem. Reminders get swiped away. Tracking apps get abandoned in a week.
            Smart bottles start around $80 and ask you to give up the bottle you actually like.
            Knowing was never the missing piece — consequences were. Sponge is $59.99, clips onto
            the bottle you already own, and locks the apps you choose until you’ve caught up.
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
              <img className="step__img" src="/media/how/step1-clip-on-bottle.jpg" width="720" height="444" decoding="async" alt="A hand holding a water bottle on its side with the Sponge Clip attached to its base, USB-C port visible" />
              <div className="step__body"><div className="step__n">1</div><h3>Clip it on</h3><p>Clip Sponge magnetically onto any water bottle in seconds. No new bottle, no setup ritual.</p></div>
            </div>
            <div className="step step--media">
              <img className="step__img" src="/media/how/step2-sip-crop.jpg" width="720" height="438" decoding="async" alt="Drinking from a bottle held on its side, with the Sponge Clip visible on its base" />
              <div className="step__body"><div className="step__n">2</div><h3>Sip like normal</h3><p>Drink the way you already do. Sponge’s sensors automatically record every sip, zero logging.</p></div>
            </div>
            <div className="step step--media">
              <img className="step__img" src="/media/how/step3-goal.jpg" width="720" height="438" decoding="async" alt="The Sponge app showing a full progress ring at 60.0 oz, 100% of the daily goal" />
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
        <img src="/media/lifestyle/band-desk.jpg" alt="" aria-hidden="true" width="1400" height="508" decoding="async" />
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
            <img className="appshot" src="/media/app/hydration-locks.webp" width="600" height="1066" decoding="async" loading="lazy" alt="The Sponge app's Hydration Locks screen, with Facebook, LinkedIn and Reddit each locked until a set amount of water is reached" />
          </div>
          <div>
            <span className="eyebrow">Hydration Locks</span>
            <h2 style={{ fontSize: 'clamp(26px,3.6vw,38px)', fontWeight: 800, margin: '16px 0 14px' }}>
              Water is the password
            </h2>
            <p style={{ color: 'var(--ink-soft)', fontSize: 18, margin: '0 0 8px' }}>
              Pick the apps you lose hours to. Sponge locks them, and they open when the water is
              actually gone — not when you promise it will be, and not when you tap “ignore”.
              Every other hydration tracker hands you a number. This one does something with it.
            </p>
            <ul className="checklist">
              <li><span className="tick">✓</span> Choose which apps to put behind your daily goal</li>
              <li><span className="tick">✓</span> Set the amount that unlocks each one</li>
              <li><span className="tick">✓</span> They unlock as you drink, sip by sip</li>
            </ul>
            <p style={{ color: 'var(--ink-soft)', fontSize: 15.5, margin: '14px 0 0' }}>
              Brutal? A little. It is also the reason people are still using Sponge in month two.
            </p>
            <div style={{ marginTop: 26, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/products" className="btn btn--primary btn--lg">Pre-order Sponge — $59.99</Link>
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
      {/* Apple Health + widget. Both confirmed capabilities of the current app;
          both screenshots are real, unretouched captures. */}
      <section className="section" id="on-your-phone">
        <div className="container">
          <SectionHead eyebrow="On your phone" title="It lives where you already look">
            Two things that mean you barely open the app, and your hydration stops being a
            number stranded in yet another place.
          </SectionHead>
          <div className="phone-pair">
            <figure className="phone-pair__item">
              <img
                src="/media/app/widget.webp"
                width="600"
                height="1304"
                loading="lazy"
                decoding="async"
                alt="An iPhone home screen with the Sponge widget showing a part-filled hydration progress ring"
              />
              <figcaption>
                <strong>A home-screen widget.</strong> Your progress ring sits on your home
                screen, so a glance is usually all it takes.
              </figcaption>
            </figure>
            <figure className="phone-pair__item">
              <img
                src="/media/app/lock-screen.webp"
                width="550"
                height="550"
                loading="lazy"
                decoding="async"
                alt="A phone lock screen reading Social Apps Locked, with Instagram, TikTok, Snapchat and Facebook padlocked and 22 oz remaining to unlock"
              />
              <figcaption>
                <strong>And a lock screen that means it.</strong> 42 of 64 oz down, 22 to go —
                and Instagram stays shut until they are.
              </figcaption>
            </figure>
          </div>
          <p className="phone-pair__note">
            Sponge also writes your intake into <strong>Apple Health</strong> on iPhone, so it
            sits with the rest of your health data rather than in a silo.
          </p>
        </div>
      </section>

      <section className="section" id="who">
        <div className="container">
          <SectionHead eyebrow="Who it’s for" title="Built for anyone who keeps forgetting to drink water">
            One simple hydration tracker, a lot of people it quietly helps every day.
          </SectionHead>
          <div className="personas">
            <article className="persona">
              <img className="persona__img" src="/media/personas/athlete.jpg" alt="Two friends playing basketball at an outdoor court" width="700" height="526" decoding="async" loading="lazy" />
              <div className="persona__body"><h3>Athletes &amp; active people</h3><p>Dial in hydration around training and recovery with accurate, automatic intake data you can trust.</p></div>
            </article>
            <article className="persona">
              <img className="persona__img" style={{ objectPosition: '50% 70%' }} src="/media/personas/professional.jpg" alt="Water bottles with the Sponge tracker on a sunny kitchen counter" width="700" height="526" decoding="async" loading="lazy" />
              <div className="persona__body"><h3>Busy professionals</h3><p>Back-to-back days make it easy to forget to drink. Sponge tracks for you and nudges before you fall behind.</p></div>
            </article>
            <Link to="/caregivers" className="persona">
              <img className="persona__img" src="/media/personas/caregiver.jpg" alt="Adult daughter with her mother and a tracked water bottle at home" width="700" height="526" decoding="async" loading="lazy" />
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
            <p>Over 100 Sponge products have shipped to real customers. Yours clips onto the bottle you already own, counts every sip, and locks the apps you choose until you catch up.</p>
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
                  <th scope="row">Syncs to Apple Health</th>
                  <td className="no">Some do</td>
                  <td className="yes">Yes</td>
                  <td className="no">Nothing to sync</td>
                  <td className="compare__us yes">Yes, on iPhone</td>
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
                  <td className="compare__us">That’s what Hydration Locks are for</td>
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
