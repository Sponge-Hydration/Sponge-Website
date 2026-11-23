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

// Step 4 only: the ring closes from 89% to 100% and the total counts up, as if a
// drink had just been logged (Nathan, 11-23). It is drawn over the real screenshot
// in that screenshot's own coordinates (1179 x 2556, measured from the file), ends
// on the screenshot's own numbers (89.9 oz, 100%), then fades away to show it.
const RING = { cx: 589.5, cy: 1295, r: 530, w: 60, disc: 471.5, goal: 80, from: 71.2, to: 89.9 }
const RING_C = 2 * Math.PI * RING.r

function RingFill() {
  const [t, setT] = useState(0)
  const [done, setDone] = useState(false)
  useEffect(() => {
    let raf
    let start
    const tick = (now) => {
      if (start === undefined) start = now + 450
      const k = Math.min(1, Math.max(0, (now - start) / 1700))
      setT(1 - (1 - k) ** 3)
      if (k < 1) raf = requestAnimationFrame(tick)
      else setDone(true)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  const oz = RING.from + (RING.to - RING.from) * t
  const pct = Math.min(1, oz / RING.goal)
  return (
    <svg className={`lockdemo__ring${done ? ' is-done' : ''}`} viewBox="0 0 600 1199" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g transform="translate(23.47 0) scale(0.46909)" fontFamily="-apple-system, 'SF Pro Display', Inter, system-ui, sans-serif">
        <rect x="0" y="630" width="1179" height="1250" fill="#000" />
        <circle cx={RING.cx} cy={RING.cy} r={RING.r} fill="none" stroke="#1e2125" strokeWidth={RING.w} />
        <circle
          cx={RING.cx} cy={RING.cy} r={RING.r} fill="none" stroke="#5cb8ff" strokeWidth={RING.w} strokeLinecap="round"
          transform={`rotate(-90 ${RING.cx} ${RING.cy})`} strokeDasharray={`${pct * RING_C} ${RING_C}`}
        />
        <circle cx={RING.cx} cy={RING.cy} r={RING.disc} fill="rgb(27,55,76)" />
        <text x={RING.cx} y="707" textAnchor="middle" fontSize="76" fontWeight="700" fill="#5cb8ff">{Math.floor(pct * 100)}%</text>
        <text x={RING.cx} y="1401" textAnchor="middle" fontWeight="800" fill="#fff">
          <tspan fontSize="300" letterSpacing="-6">{oz.toFixed(1)}</tspan>
          <tspan fontSize="130" dx="14">oz</tspan>
        </text>
      </g>
    </svg>
  )
}

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

  // Not with reduced motion: the still screenshot already shows the end state.
  const [motion, setMotion] = useState(false)
  useEffect(() => { setMotion(!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) }, [])

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
          {motion && step === 3 && <RingFill />}
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
