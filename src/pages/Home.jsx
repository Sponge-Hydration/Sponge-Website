import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Seo } from '../components/useSEO'
import { Eyebrow, SectionHead } from '../components/bits'
import Reviews from '../components/Reviews'
import { useCart } from '../cart/CartContext'
import { DropletIcon, MagnetIcon, BatteryIcon, PhoneIcon, LockIcon, HeartIcon } from '../components/icons'
// Imported rather than referenced from public/ so Vite emits them with a content
// hash. Files in public/ are copied verbatim and served with max-age=14400, so
// reusing one filename across revisions left browsers on a stale cut for hours.
import heroFilm from '../media/hero-film.mp4'
import heroPoster from '../media/hero-film-poster.jpg'

// Each feature card opens the detail behind it (Nathan, 2026-09-22): people
// click these to learn more, so sending every card to the product page read as
// a hard sell. A `to` beginning with # stays on this page.
const features = [
  { icon: DropletIcon, title: 'Automatic sip tracking', text: 'On-device sensors log every sip the moment you drink, no buttons, no manual logging, no guessing how much water you’ve had.', to: '/how-it-works', more: 'See how it measures' },
  { icon: MagnetIcon, title: 'Clips to any bottle', text: 'A magnetic clip snaps onto the bottle you already own, from insulated steel to glass tumblers. No proprietary bottle to replace.', to: '/how-it-works#tutorials', more: 'Watch it attach' },
  { icon: BatteryIcon, title: '2-week battery', text: 'Roughly a fortnight between charges, then top up in a couple of hours over USB-C. Most people plug it in twice a month.', to: '/how-it-works#faq-battery', more: 'Battery and charging' },
  { icon: PhoneIcon, title: 'Free app, plus a widget', text: 'A clean dashboard with daily goals, streaks and trends — and an iPhone home-screen widget, so most days you never open the app at all.', to: '/how-it-works#app-setup', more: 'See the app' },
  { icon: LockIcon, title: 'Hydration Locks', text: 'Choose the apps you lose hours to and set what unlocks each one. They stay shut until the water is actually gone.', to: '#locks', more: 'How Hydration Locks work' },
  { icon: HeartIcon, title: 'Apple Health sync — next update', text: 'Writing your intake straight into Apple Health on iPhone is in testing now and ships with the next app update.', to: '/how-it-works#faq-apple-health', more: 'Apple Health status' },
]

// The three how-it-works cards each play a short, silent clip of their step.
// All real footage: step 1 the Sponge snapping onto a bottle (tutorial pt. 2
// shoot, IMG_7670), step 2 a drink on the court (IMG_7345), step 3 a bottle set
// down, then the phone ring going 34.1 to 52.3 oz at 100% (IMG_7282). 720x440,
// no audio, fetched only when first played.
const STEPS = [
  {
    n: 1, title: 'Clip it on',
    text: 'Clip Sponge magnetically onto any water bottle in seconds. No new bottle, no setup ritual.',
    img: '/media/how/step1-clip-on-bottle.jpg', w: 720, h: 444,
    alt: 'A hand holding a water bottle on its side with the Sponge Clip attached to its base, USB-C port visible',
    video: '/media/how/step1-clip-on.mp4', label: 'the Sponge snapping onto the bottom of a bottle',
  },
  {
    n: 2, title: 'Sip like normal',
    text: 'Drink the way you already do. Sponge’s sensors automatically record every sip, zero logging.',
    img: '/media/how/step2-sip-crop.jpg', w: 720, h: 438,
    alt: 'Drinking from a bottle held on its side, with the Sponge Clip visible on its base',
    video: '/media/how/step2-sip.mp4', label: 'someone drinking from a bottle with a Sponge on it',
  },
  {
    n: 3, title: 'Hit your goal',
    text: 'The app tracks your intake in real time, nudges you when you fall behind, and celebrates your streaks.',
    img: '/media/how/step3-goal.jpg', w: 720, h: 438,
    alt: 'The Sponge app showing a full progress ring at 60.0 oz, 100% of the daily goal',
    video: '/media/how/step3-goal.mp4', label: 'a bottle set down, then the app’s ring climbing from 34.1 to 52.3 ounces, 100% of the goal',
  },
]

/**
 * A how-it-works card that plays its clip. With a mouse, hovering plays it and
 * leaving rewinds it, and a click plays it too. Touch screens have no hover, so
 * there a tap toggles it. The clip only starts because of something the visitor
 * did, and the Watch/Pause button gives keyboard and screen-reader users the
 * same control.
 */
function StepCard({ step }) {
  const videoRef = useRef(null)
  const hoverRef = useRef(false)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    hoverRef.current =
      window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  const play = () => {
    const v = videoRef.current
    if (!v) return
    const p = v.play()
    if (p && p.catch) p.catch(() => setPlaying(false))
  }
  const stop = (rewind) => {
    const v = videoRef.current
    if (!v) return
    v.pause()
    if (rewind) v.currentTime = 0
  }
  const toggle = () => (videoRef.current?.paused ? play() : stop(false))

  return (
    <div
      className={`step step--media step--play${playing ? ' is-playing' : ''}`}
      onMouseEnter={() => hoverRef.current && play()}
      onMouseLeave={() => hoverRef.current && stop(true)}
      onClick={() => (hoverRef.current ? play() : toggle())}
    >
      <div className="step__media">
        <img className="step__img" src={step.img} width={step.w} height={step.h} decoding="async" alt={step.alt} />
        <video
          ref={videoRef}
          className="step__video"
          src={step.video}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
          tabIndex={-1}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
        <button
          type="button"
          className="step__toggle"
          aria-pressed={playing}
          aria-label={`${playing ? 'Pause' : 'Play'} video: ${step.label}`}
          onClick={(e) => {
            e.stopPropagation()
            toggle()
          }}
        >
          {playing ? (
            <svg viewBox="0 0 12 12" aria-hidden="true"><rect x="1.5" y="1" width="3" height="10" rx="1" /><rect x="7.5" y="1" width="3" height="10" rx="1" /></svg>
          ) : (
            <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 1.2v9.6c0 .5.5.8.9.5l7.4-4.8c.4-.3.4-.8 0-1L3.4.7c-.4-.3-.9 0-.9.5z" /></svg>
          )}
          <span>{playing ? 'Pause' : 'Watch'}</span>
        </button>
      </div>
      <div className="step__body"><div className="step__n">{step.n}</div><h3>{step.title}</h3><p>{step.text}</p></div>
    </div>
  )
}

// The hero plays Sponge's own explainer cut: the device, then "Sponge is a water
// intake recording device" / "It tracks your sips automatically", then the setup
// in three beats — peel, place, snap it on — closing on studio product shots.
//
// It opens on the device and closes on white studio, so the last 0.7s is dissolved
// over the first 0.7s to make the loop point invisible. Audio is stripped because
// hero autoplay must be muted; the captions carry the message instead.
//
// The panel plays it at its own 9:16 aspect, so nothing is cropped at any width.
// Run scripts/hero-crop-audit.mjs after changing the file or the panel CSS.
const HERO_VIDEO_ENABLED = true

/**
 * Hero media. A muted 28.8-second video that autoplays and loops is "moving
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

  if (!HERO_VIDEO_ENABLED || reduced) {
    return <img className="hero__film" src={heroPoster} alt="" width="800" height="1422" />
  }

  return (
    <>
      <video
        className="hero__film"
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        poster={heroPoster}
      >
        <source src={heroFilm} type="video/mp4" />
      </video>
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
  // "Order now": drop a single Sponge clip in the cart and take the visitor to
  // the cart, where they can confirm colour/quantity before checking out.
  const orderNow = () => {
    add('sponge-clip', 1)
    navigate('/cart')
  }
  return (
    <>
      <Seo
        title="Sponge Hydration Tracker | Smart Water Intake Tracker for Any Bottle"
        description="Sponge is a smart hydration tracker that clips onto any water bottle and automatically tracks your water intake. Logs every sip, syncs to the app, and locks distracting apps until you hit your goal. 2-week battery. Pre-order $59.99."
        path="/"
      />
      {/* Hero */}
      <section className="hero" id="top">
        <div className="container hero__grid">
          <div className="hero__copy">
            <span className="eyebrow">Order now · Cancel any time before it ships</span>
            <h1>The smart <span className="accent">hydration tracker</span> for any water bottle</h1>
            <p className="hero__sub">
              Sponge is a clip-on hydration tracking device that automatically tracks your
              water intake, every sip, from the bottle you already own. Clip it on, drink, and let
              the app keep you on track to your daily goal.
            </p>
            <div className="hero__cta">
              <button type="button" onClick={orderNow} className="btn btn--primary btn--lg">Order Sponge now</button>
              <a href="#how" className="btn btn--ghost btn--lg">See how it works</a>
            </div>
            <div className="hero__rating">
              <span>$59.99 + shipping &amp; tax · Ships to the US · 30-day money-back guarantee</span>
            </div>
            <div className="hero__note">
              <span><i className="dot" />Works with any bottle</span>
              <span><i className="dot" />2-week battery</span>
              <span><i className="dot" />Free iOS &amp; Android app</span>
            </div>
          </div>

          <div className="hero__media">
            <HeroBackground />
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="trust">
        <div className="container trust__grid">
          <div><div className="trust__num">100+</div><div className="trust__lbl">Sponge products shipped</div></div>
          <div><div className="trust__num">30-day</div><div className="trust__lbl">Money-back guarantee</div></div>
          <div><div className="trust__num">2 weeks</div><div className="trust__lbl">Battery life</div></div>
          <div><div className="trust__num">App Lock</div><div className="trust__lbl">Apps stay shut until you drink</div></div>
        </div>
      </section>

      {/* Product showcase */}
      <section className="section">
        <div className="container">
          <SectionHead eyebrow="Meet Sponge" eyebrowTo="/blog/the-story-behind-sponge" title="One tracker. Every sip, counted.">
            Sponge clips onto the bottle you already carry and quietly logs your hydration all day long.
          </SectionHead>
          <p style={{ textAlign: 'center', margin: '-18px 0 28px' }}>
            <Link to="/blog/the-story-behind-sponge" className="section-head__more">Read how Sponge started →</Link>
          </p>
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
          <Eyebrow to="/blog/the-dehydration-problem">The problem</Eyebrow>
          <h2>You already know you should drink more water</h2>
          <p>
            That’s the problem. Reminders get swiped away. Tracking apps get abandoned in a week.
            Smart bottles start around $80 and ask you to give up the bottle you actually like.
            Knowing was never the missing piece — consequences were. Sponge is $59.99, clips onto
            the bottle you already own, and locks the apps you choose until you’ve caught up.
          </p>
          <Link to="/blog/the-dehydration-problem" className="section-head__more">The research behind the problem →</Link>
        </div>
      </section>

      {/* How it works */}
      <section className="section" id="how">
        <div className="container">
          <SectionHead eyebrow="How it works" eyebrowTo="/how-it-works" title="Clip, sip, repeat">
            A genuinely passive hydration tracker. Three steps, then it disappears into your day.
          </SectionHead>
          <div className="steps">
            {STEPS.map((step) => <StepCard key={step.n} step={step} />)}
          </div>
        </div>
      </section>

      {/* Lifestyle band */}
      {/* aria-hidden belongs on the decorative photo only — putting it on the
          section also hid the visible headline from screen readers. */}
      <section className="lifestyle-band">
        {/* Cropped from the source above y=1730, where a generative-AI sparkle
            and a faded watermark box sit — neither is inside this crop. Authored
            at 2.756, the band's widest rendered aspect. */}
        <img src="/media/lifestyle/band-track.jpg" alt="" aria-hidden="true" width="1400" height="508" decoding="async" />
        <div className="lifestyle-band__overlay">
          <p className="lifestyle-band__quote">Hydration that keeps up with you, on the court, at the desk, everywhere.</p>
        </div>
      </section>

      {/* Features */}
      <section className="section" id="features">
        <div className="container">
          <SectionHead eyebrow="Features" eyebrowTo="/how-it-works#faq" title="Everything a hydration tracking device should be">
            Effortless to use, impossible to forget, and built around the bottle you already carry.
          </SectionHead>
          <div className="features">
            {features.map((f) => {
              const inner = (
                <>
                  <div className="feature__icon" aria-hidden="true"><f.icon size={30} /></div>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                  <span className="feature__more">{f.more} →</span>
                </>
              )
              return f.to.startsWith('#')
                ? <a href={f.to} className="feature feature--link" key={f.title}>{inner}</a>
                : <Link to={f.to} className="feature feature--link" key={f.title}>{inner}</Link>
            })}
          </div>
        </div>
      </section>

      {/* App-lock split */}
      <section className="section section--tint" id="locks">
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
              <button type="button" onClick={orderNow} className="btn btn--primary btn--lg">Order Sponge now — $59.99</button>
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
      {/* Widget is a confirmed capability of the shipping app. Apple Health sync is
          in TestFlight and NOT yet released - it must stay future-tense here
          and in the FAQ until it ships. Screenshots are real, unretouched. */}
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
            <div className="phone-pair__stack">
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
            <figure className="phone-pair__item">
              <img
                src="/media/app/day-chart.webp"
                width="600"
                height="746"
                loading="lazy"
                decoding="async"
                alt="The Sponge app showing a day's intake: 78.3 oz total, plotted as a rising line that crosses a dashed 60 oz goal line in the early evening"
              />
              <figcaption>
                <strong>And the whole day, drawn for you.</strong> Every sip lands on the
                curve as it happens. This one sat flat overnight, climbed all day, crossed its
                60 oz goal in the early evening and finished at 78.3.
              </figcaption>
            </figure>
            </div>
          </div>
          <p className="phone-pair__note">
            <strong>Apple Health sync</strong> is in testing now and arrives with the next app
            update, so your intake will sit with the rest of your health data rather than in a silo.
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
              <img className="persona__img" src="/media/personas/athlete.jpg" alt="Two water bottles with Sponge trackers clipped to their bases on an outdoor basketball court" width="740" height="370" decoding="async" loading="lazy" />
              <div className="persona__body"><h3>Athletes &amp; active people</h3><p>Dial in hydration around training and recovery with automatic intake data instead of end-of-day guesswork.</p></div>
            </article>
            <article className="persona">
              <img className="persona__img" src="/media/personas/professional.jpg" alt="A water bottle with a Sponge tracker at its base beside a laptop, next to a phone showing 52.3 oz logged in the Sponge app" width="740" height="370" decoding="async" loading="lazy" />
              <div className="persona__body"><h3>Busy professionals</h3><p>Back-to-back days make it easy to forget to drink. Sponge tracks for you and nudges before you fall behind.</p></div>
            </article>
            <Link to="/caregivers" className="persona">
              <img className="persona__img" src="/media/personas/caregiver.jpg" alt="A hand holding a Sponge tracker on a kitchen counter beside a Sponge-branded water bottle" width="740" height="370" decoding="async" loading="lazy" />
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
            <button type="button" className="btn btn--ghost btn--lg" onClick={orderNow}>Order Sponge now — $59.99</button>
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
          <SectionHead eyebrow="How it compares" eyebrowTo="/blog/smart-bottle-vs-clip-on-tracker" title="Four ways to drink more water">
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
                  <td className="compare__us">In the next update</td>
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
          <SectionHead eyebrow="Before you buy" eyebrowTo="/how-it-works#faq" title="The honest answers">
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
