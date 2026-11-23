import { useEffect, useRef, useState } from 'react'

// Click-through walk of Hydration Locks (Nathan, 2026-11-23: "an interactive app
// preview or slideshow that you can click through depicting how it works").
// Every screen is a real, unretouched app screenshot, cropped only to remove the
// status bar (step 4 is shown whole, or its header is cut off). Steps 2 to 5 are
// one matching set at an 80 oz unlock goal (Nathan's 11-23 screenshots). All five images are in the prerendered page, so nothing depends on
// script to be seen; script only decides which one is on top.
export const LOCK_STEPS = [
  {
    img: '/media/app/locks-step1.webp',
    title: 'Choose which apps to put behind your daily goal',
    body: 'Instagram, TikTok, anything you lose hours to.',
    alt: 'The app picker in the Sponge app, with Instagram ticked.',
  },
  {
    img: '/media/app/locks-step2.webp',
    title: 'Set the amount that unlocks each one',
    body: 'Here Instagram opens at 80 oz.',
    alt: 'The unlock goal picker for Instagram in the Sponge app, set to 80 oz.',
  },
  {
    img: '/media/app/locks-step3.webp',
    title: 'Open a locked app and Sponge is in the way',
    body: 'It tells you exactly how much water is left before it opens.',
    alt: 'The Sponge Lock screen shown over a locked app: 26 of 80 oz completed, 54 oz left to unlock.',
  },
  {
    img: '/media/app/locks-step4.webp',
    title: 'Drink, and the Sponge on your bottle counts it',
    body: 'No logging and no buttons. The ring fills as you sip.',
    alt: 'The Sponge home screen with the ring full at 89.9 oz, 100% of the goal.',
  },
  {
    img: '/media/app/locks-step5.webp',
    title: 'They unlock as you drink, sip by sip',
    body: 'Reach the amount you set and the app opens.',
    alt: 'Sponge Mode showing Instagram and TikTok unlocked at 80 oz, 0 oz remaining.',
  },
]

const AUTO_MS = 3800

export default function LockDemo() {
  const [step, setStep] = useState(0)
  const [auto, setAuto] = useState(false)
  const root = useRef(null)
  const n = LOCK_STEPS.length

  // Plays by itself while on screen, until the visitor takes over. Never with
  // reduced motion.
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined
    const io = new IntersectionObserver(([e]) => setAuto((a) => (a === null ? null : e.isIntersecting)), { threshold: 0.5 })
    if (root.current) io.observe(root.current)
    return () => io.disconnect()
  }, [])
  useEffect(() => {
    if (!auto) return undefined
    const t = setTimeout(() => setStep((s) => (s + 1) % n), AUTO_MS)
    return () => clearTimeout(t)
  }, [auto, step, n])

  const go = (i) => { setAuto(null); setStep(((i % n) + n) % n) }

  return (
    <div className="lockdemo" ref={root}>
      <div className="lockdemo__stage">
        <button type="button" className="lockdemo__phone" onClick={() => go(step + 1)} aria-label="Next step">
          {LOCK_STEPS.map((s, i) => (
            <img
              key={s.img}
              className={`lockdemo__shot${i === step ? ' is-on' : ''}`}
              src={s.img}
              alt={s.alt}
              width="600"
              height="1199"
              loading="lazy"
              decoding="async"
            />
          ))}
        </button>
        <div className="lockdemo__nav">
          <button type="button" className="lockdemo__arrow" onClick={() => go(step - 1)} aria-label="Previous step">←</button>
          <span className="lockdemo__count" aria-live="polite">Step {step + 1} of {n}</span>
          <button type="button" className="lockdemo__arrow" onClick={() => go(step + 1)} aria-label="Next step">→</button>
        </div>
      </div>
      <ol className="lockdemo__steps">
        {LOCK_STEPS.map((s, i) => (
          <li key={s.title}>
            <button
              type="button"
              className={`lockdemo__step${i === step ? ' is-on' : ''}`}
              onClick={() => go(i)}
              aria-current={i === step ? 'step' : undefined}
            >
              <span className="lockdemo__num">{i + 1}</span>
              <span>
                <strong>{s.title}</strong>
                <span className="lockdemo__body">{s.body}</span>
              </span>
              {i === step && auto && <span className="lockdemo__bar" key={step} style={{ animationDuration: `${AUTO_MS}ms` }} />}
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}
