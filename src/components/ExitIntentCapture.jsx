import { useEffect, useRef, useState } from 'react'
import EmailSignup from './EmailSignup'
import { useCart } from '../cart/CartContext'

/**
 * Exit-intent email capture. Fires once per visitor when they look like they're
 * about to leave, to recover them into the batch list instead of losing them.
 *
 * Deliberately restrained so it never annoys:
 *  - shows at most once per visitor (localStorage flag), even across pages;
 *  - only arms after a few seconds, so it never fires on an instant bounce;
 *  - never shown to someone with an item in their cart: they are buying, and
 *    a popup would only get in the way;
 *  - desktop trigger is the mouse leaving through the top of the viewport;
 *  - phones (no mouseout) trigger when the visitor comes BACK to the tab after
 *    leaving it. It used to be a fast upward scroll near the top, but that is
 *    exactly what someone does to get back to the buy button;
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
  const { items } = useCart()
  const hasCart = useRef(false)
  hasCart.current = items.length > 0

  useEffect(() => {
    let seen = false
    try { seen = localStorage.getItem(SEEN_KEY) === '1' } catch { /* private mode */ }
    if (seen) return

    const armTimer = setTimeout(() => { armed.current = true }, 5000)
    const markSeen = () => { try { localStorage.setItem(SEEN_KEY, '1') } catch { /* ignore */ } }

    // A buyer is never interrupted; the popup stays available for a later visit.
    const trigger = () => {
      if (hasCart.current) return
      setOpen(true); markSeen(); cleanup()
    }

    const onMouseOut = (e) => {
      if (!armed.current) return
      if (e.clientY <= 0 && !e.relatedTarget) trigger()
    }
    // Touch devices: fire when they return to this tab after at least a few
    // seconds away (the phone equivalent of heading for the tab bar).
    const touch = window.matchMedia?.('(pointer: coarse)').matches
    let hiddenAt = 0
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') { hiddenAt = Date.now(); return }
      if (armed.current && hiddenAt && Date.now() - hiddenAt >= 3000) trigger()
    }
    function cleanup() {
      document.removeEventListener('mouseout', onMouseOut)
      document.removeEventListener('visibilitychange', onVisibility)
    }

    document.addEventListener('mouseout', onMouseOut)
    if (touch) document.addEventListener('visibilitychange', onVisibility)
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
