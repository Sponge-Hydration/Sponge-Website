import { useEffect, useRef, useState } from 'react'
import EmailSignup from './EmailSignup'

/**
 * Exit-intent email capture. Fires once per visitor when they look like they're
 * about to leave, to recover them into the batch list instead of losing them.
 *
 * Deliberately restrained so it never annoys:
 *  - shows at most once per visitor (localStorage flag), even across pages;
 *  - only arms after a few seconds, so it never fires on an instant bounce;
 *  - desktop trigger is the mouse leaving through the top of the viewport;
 *  - mobile (no mouseout) falls back to a fast upward scroll near the top;
 *  - dismissible by ×, Escape, or backdrop click.
 *
 * SSG-safe: every window/localStorage access is inside an effect, and it renders
 * nothing until it opens, so prerendering in Node is untouched.
 */
const SEEN_KEY = 'sponge-exit-intent-v1'

export default function ExitIntentCapture() {
  const [open, setOpen] = useState(false)
  const armed = useRef(false)
  const closeRef = useRef(null)

  useEffect(() => {
    let seen = false
    try { seen = localStorage.getItem(SEEN_KEY) === '1' } catch { /* private mode */ }
    if (seen) return

    const armTimer = setTimeout(() => { armed.current = true }, 5000)
    const markSeen = () => { try { localStorage.setItem(SEEN_KEY, '1') } catch { /* ignore */ } }

    const trigger = () => { setOpen(true); markSeen(); cleanup() }

    const onMouseOut = (e) => {
      if (!armed.current) return
      if (e.clientY <= 0 && !e.relatedTarget) trigger()
    }
    let lastY = typeof window !== 'undefined' ? window.scrollY : 0
    const onScroll = () => {
      if (!armed.current) return
      const y = window.scrollY
      if (lastY - y > 40 && y < 240) trigger()
      lastY = y
    }
    function cleanup() {
      document.removeEventListener('mouseout', onMouseOut)
      window.removeEventListener('scroll', onScroll)
    }

    document.addEventListener('mouseout', onMouseOut)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { clearTimeout(armTimer); cleanup() }
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    closeRef.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  if (!open) return null

  return (
    <div
      className="exit-intent"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-intent-title"
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
    >
      <div className="exit-intent__card">
        <button ref={closeRef} type="button" className="exit-intent__close" aria-label="Close" onClick={() => setOpen(false)}>×</button>
        <h2 id="exit-intent-title">Before you go, grab a mystery gift</h2>
        <p>
          Join the Sponge list and we’ll email you a mystery gift right now. One email a month
          after that, unsubscribe anytime.
        </p>
        <EmailSignup
          source="exit-intent"
          label="Email address"
          cta="Send my mystery gift"
          done="You’re in. Check your inbox for your mystery gift."
        />
      </div>
    </div>
  )
}
