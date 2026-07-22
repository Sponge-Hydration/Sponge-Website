import { useEffect, useRef, useState } from 'react'

// Interactive animated walkthrough: from box to sip-by-sip tracking.
// Auto-advances through the five scenes; hovering or focusing pauses it.

const STEPS = [
  {
    id: 'charge',
    label: 'Charge',
    title: 'Charge it over USB-C',
    body: 'Plug in your Sponge for a couple of hours. One full charge lasts about 8 days.',
    dur: 5000,
  },
  {
    id: 'pair',
    label: 'Pair',
    title: 'Pair the free app',
    body: 'Open the Sponge app and connect over Bluetooth. It walks you through calibrating your bottle in about two minutes.',
    dur: 5000,
  },
  {
    id: 'attach',
    label: 'Attach',
    title: 'Snap it under your bottle',
    body: 'The magnetic mount clicks onto the bottom of the bottle you already own, steel, plastic, or glass.',
    dur: 5000,
  },
  {
    id: 'setdown',
    label: 'Set down',
    title: 'Set the bottle down',
    body: 'Every time your bottle lands, load cells and an accelerometer take a precise weight reading.',
    dur: 5600,
  },
  {
    id: 'sip',
    label: 'Sip & repeat',
    title: 'Sip, set it down, repeat',
    body: 'Sponge compares readings between sips to measure exactly how much you drank, all day, automatically.',
    dur: 6400,
  },
]

function Bottle({ x = 0, y = 0, className = '' }) {
  return (
    <g className={className} transform={`translate(${x} ${y})`}>
      {/* cap */}
      <rect x="22" y="0" width="36" height="14" rx="5" fill="var(--ink, #10344f)" opacity="0.85" />
      {/* body */}
      <path
        d="M8 26 Q8 14 20 14 h40 Q72 14 72 26 v96 q0 10 -10 10 H18 q-10 0 -10 -10 Z"
        fill="#dceefc"
        stroke="#9cc6e8"
        strokeWidth="2"
      />
      {/* water */}
      <clipPath id="sx-bottle-clip">
        <path d="M10 28 Q10 16 20 16 h40 Q70 16 70 28 v94 q0 8 -8 8 H18 q-8 0 -8 -8 Z" />
      </clipPath>
      <rect className="sx-water" clipPath="url(#sx-bottle-clip)" x="10" y="52" width="60" height="82" fill="#7cc4ff" opacity="0.75" />
    </g>
  )
}

function Device({ x = 0, y = 0, lit = false, className = '' }) {
  return (
    <g className={className} transform={`translate(${x} ${y})`}>
      <rect x="0" y="0" width="80" height="16" rx="8" fill="#12263c" />
      <rect x="6" y="12" width="68" height="3" rx="1.5" fill={lit ? 'var(--aqua-400, #37d0c6)' : '#3d5a78'} className={lit ? 'sx-led' : ''} />
    </g>
  )
}

function SceneCharge() {
  return (
    <svg viewBox="0 0 420 240" className="sx-scene" aria-hidden="true">
      <line x1="40" y1="196" x2="380" y2="196" stroke="#c8dcee" strokeWidth="3" strokeLinecap="round" />
      <Device x={170} y={172} lit />
      {/* USB-C cable slides in */}
      <g className="sx-cable">
        <rect x="96" y="174" width="30" height="12" rx="4" fill="#41608a" />
        <path d="M96 180 H30" stroke="#41608a" strokeWidth="6" strokeLinecap="round" />
      </g>
      {/* charge ring */}
      <g className="sx-charge-ring">
        <circle cx="210" cy="120" r="34" fill="none" stroke="#d7e9f8" strokeWidth="8" />
        <circle cx="210" cy="120" r="34" fill="none" stroke="var(--blue-600, #0b6bcb)" strokeWidth="8" strokeLinecap="round" strokeDasharray="214" strokeDashoffset="214" className="sx-charge-fill" transform="rotate(-90 210 120)" />
        <path d="M212 102 l-12 22 h10 l-4 16 14 -24 h-10 Z" fill="var(--blue-600, #0b6bcb)" className="sx-bolt" />
      </g>
    </svg>
  )
}

function ScenePair() {
  return (
    <svg viewBox="0 0 420 240" className="sx-scene" aria-hidden="true">
      <line x1="40" y1="196" x2="380" y2="196" stroke="#c8dcee" strokeWidth="3" strokeLinecap="round" />
      {/* phone */}
      <g>
        <rect x="86" y="52" width="86" height="144" rx="14" fill="#ffffff" stroke="#9cc6e8" strokeWidth="3" />
        <rect x="100" y="78" width="58" height="8" rx="4" fill="#d7e9f8" />
        <rect x="100" y="94" width="40" height="8" rx="4" fill="#d7e9f8" />
        <path d="M129 132 l-8 12 a10 10 0 1 0 16 0 Z" fill="var(--blue-600, #0b6bcb)" transform="translate(0 4)" />
        <circle cx="129" cy="182" r="6" fill="#d7e9f8" />
      </g>
      <Device x={250} y={172} lit />
      {/* bluetooth arcs */}
      <g className="sx-arcs" stroke="var(--aqua-400, #37d0c6)" strokeWidth="4" fill="none" strokeLinecap="round">
        <path d="M196 150 q14 14 0 28" className="sx-arc sx-arc--1" />
        <path d="M212 138 q26 26 0 52" className="sx-arc sx-arc--2" />
        <path d="M228 126 q38 38 0 76" className="sx-arc sx-arc--3" />
      </g>
      <g className="sx-paired">
        <circle cx="290" cy="120" r="16" fill="var(--aqua-400, #37d0c6)" />
        <path d="m283 120 5 5 9 -10" stroke="#fff" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  )
}

function SceneAttach() {
  return (
    <svg viewBox="0 0 420 240" className="sx-scene" aria-hidden="true">
      <line x1="40" y1="216" x2="380" y2="216" stroke="#c8dcee" strokeWidth="3" strokeLinecap="round" />
      <g className="sx-attach-bottle">
        <Bottle x={170} y={10} />
      </g>
      <g className="sx-attach-device">
        <Device x={170} y={176} lit />
      </g>
      {/* magnet snap sparks */}
      <g className="sx-snap" stroke="var(--blue-600, #0b6bcb)" strokeWidth="3.5" strokeLinecap="round">
        <path d="M150 168 l-14 -8" />
        <path d="M146 184 h-16" />
        <path d="M270 168 l14 -8" />
        <path d="M274 184 h16" />
      </g>
    </svg>
  )
}

function SceneSetDown() {
  return (
    <svg viewBox="0 0 420 240" className="sx-scene" aria-hidden="true">
      <line x1="40" y1="216" x2="380" y2="216" stroke="#c8dcee" strokeWidth="3" strokeLinecap="round" />
      <g className="sx-lower">
        <Bottle x={170} y={44} />
        <Device x={170} y={198} lit />
      </g>
      {/* reading ripples from the base */}
      <g className="sx-ripples" fill="none" stroke="var(--aqua-400, #37d0c6)" strokeWidth="3">
        <ellipse cx="210" cy="216" rx="52" ry="10" className="sx-ripple sx-ripple--1" />
        <ellipse cx="210" cy="216" rx="82" ry="16" className="sx-ripple sx-ripple--2" />
      </g>
      <g className="sx-reading">
        <rect x="256" y="120" width="118" height="34" rx="17" fill="#0c1d34" opacity="0.9" />
        <circle cx="274" cy="137" r="5" fill="var(--aqua-400, #37d0c6)" className="sx-led" />
        <text x="288" y="142" fontSize="15" fontWeight="700" fill="#fff" fontFamily="inherit">Reading…</text>
      </g>
    </svg>
  )
}

function SceneSip() {
  return (
    <svg viewBox="0 0 420 240" className="sx-scene" aria-hidden="true">
      <line x1="40" y1="216" x2="380" y2="216" stroke="#c8dcee" strokeWidth="3" strokeLinecap="round" />
      <g className="sx-sip-group">
        <Bottle x={170} y={44} className="sx-sip-bottle" />
        <Device x={170} y={198} lit />
      </g>
      <g className="sx-ripples" fill="none" stroke="var(--aqua-400, #37d0c6)" strokeWidth="3">
        <ellipse cx="210" cy="216" rx="52" ry="10" className="sx-ripple sx-ripple--sip" />
      </g>
      {/* counted chip */}
      <g className="sx-count">
        <rect x="262" y="96" width="106" height="34" rx="17" fill="var(--blue-600, #0b6bcb)" />
        <text x="315" y="119" fontSize="16" fontWeight="800" fill="#fff" textAnchor="middle" fontFamily="inherit">+120 ml</text>
      </g>
      {/* repeat arrow */}
      <g className="sx-loop" fill="none" stroke="#7ba7cc" strokeWidth="3.5" strokeLinecap="round">
        <path d="M92 168 a48 48 0 0 1 48 -48" />
        <path d="m132 112 10 8 -12 8" fill="none" />
      </g>
    </svg>
  )
}

const SCENES = [SceneCharge, ScenePair, SceneAttach, SceneSetDown, SceneSip]

export default function SetupExplainer() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const timer = useRef(null)

  useEffect(() => {
    if (paused) return undefined
    timer.current = setTimeout(() => {
      setActive((a) => (a + 1) % STEPS.length)
    }, STEPS[active].dur)
    return () => clearTimeout(timer.current)
  }, [active, paused])

  const Scene = SCENES[active]
  const step = STEPS[active]

  return (
    <div
      className="sx"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="sx__stage">
        {/* key remounts the scene so its animations restart */}
        <Scene key={step.id} />
        <div className="sx__caption" key={`cap-${step.id}`}>
          <h3>{step.title}</h3>
          <p>{step.body}</p>
        </div>
      </div>
      <div className="sx__steps" role="tablist" aria-label="Setup steps">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={i === active}
            className={`sx__step${i === active ? ' is-active' : ''}${i < active ? ' is-done' : ''}`}
            onClick={() => setActive(i)}
          >
            <span className="sx__step-n">{i + 1}</span>
            <span className="sx__step-label">{s.label}</span>
            {i === active && !paused && (
              <span className="sx__step-progress" style={{ animationDuration: `${s.dur}ms` }} />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
