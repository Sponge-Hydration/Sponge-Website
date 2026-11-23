import { useEffect, useRef, useState } from 'react'
import { useOrderNow } from '../cart/useOrderNow'
import { usd } from './bits'
import {
  BLACK_FRIDAY, BF_OPEN_EVENT, BF_SEEN_KEY, BF_CODE_KEY, blackFridayActive, timeLeft,
} from '../blackFriday'

/**
 * Black Friday pop-up: $10 off until the end of Black Friday.
 *
 * Built to sell without costing search ranking:
 *  - never on arrival. Google demotes mobile pages whose pop-up covers the
 *    content as soon as you land from search, so it waits for real interest:
 *    7 seconds on the page or a quarter of the page scrolled, whichever first;
 *  - on phones it is a bottom sheet, so the page stays visible above it;
 *  - once per visitor (dismiss or claim both count); the hero pill reopens it;
 *  - nothing is prerendered, so the crawled HTML is unchanged.
 */
export default function BlackFridayOffer() {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [left, setLeft] = useState('')
  const closeRef = useRef(null)
  const orderNow = useOrderNow()

  // Auto-open once, after interest.
  useEffect(() => {
    if (!blackFridayActive()) return
    let seen = false
    try { seen = localStorage.getItem(BF_SEEN_KEY) === '1' } catch { /* private mode */ }
    const show = () => { setOpen(true); cleanup() }
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (max > 0 && window.scrollY / max > 0.25) show()
    }
    const t = seen ? null : setTimeout(show, 7000)
    if (!seen) window.addEventListener('scroll', onScroll, { passive: true })
    const onOpen = () => setOpen(true)
    window.addEventListener(BF_OPEN_EVENT, onOpen)
    function cleanup() { clearTimeout(t); window.removeEventListener('scroll', onScroll) }
    return () => { cleanup(); window.removeEventListener(BF_OPEN_EVENT, onOpen) }
  }, [])

  useEffect(() => {
    if (!open) return
    try {
      localStorage.setItem(BF_SEEN_KEY, '1')
      sessionStorage.setItem(BF_CODE_KEY, BLACK_FRIDAY.code) // the cart reminds them
    } catch { /* ignore */ }
    // Tells the exit-intent pop-up to stand down: one pop-up per visit.
    window.__spongeBfShown = true
    setLeft(timeLeft())
    const tick = setInterval(() => setLeft(timeLeft()), 30000)
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    closeRef.current?.focus()
    return () => { clearInterval(tick); document.removeEventListener('keydown', onKey) }
  }, [open])

  if (!open) return null

  const copy = async () => {
    try { await navigator.clipboard.writeText(BLACK_FRIDAY.code); setCopied(true) } catch { /* ignore */ }
  }
  const claim = async () => { await copy(); setOpen(false); orderNow() }
  const sale = BLACK_FRIDAY.deliveredPrice - BLACK_FRIDAY.amountOff

  return (
    <div
      className="bf"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bf-title"
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
    >
      <div className="bf__card">
        <button ref={closeRef} type="button" className="bf__close" aria-label="Close" onClick={() => setOpen(false)}>×</button>
        <div className="bf__top">
          <span className="bf__tag">Black Friday</span>
          <span className="bf__timer" aria-live="off">Ends in {left}</span>
        </div>
        <p id="bf-title" className="bf__title">
          <span className="bf__amount">${BLACK_FRIDAY.amountOff} off</span> Sponge
        </p>
        <p className="bf__price">
          <s>{usd(BLACK_FRIDAY.deliveredPrice)}</s> <strong>{usd(sale)}</strong> delivered
        </p>
        <button type="button" className="bf__code" onClick={copy}>
          <span>Code</span> <strong>{BLACK_FRIDAY.code}</strong>
          <em>{copied ? 'Copied ✓' : 'Tap to copy'}</em>
        </button>
        <button type="button" className="btn btn--primary btn--lg btn--block" onClick={claim}>
          Claim ${BLACK_FRIDAY.amountOff} off
        </button>
        <p className="bf__fine">
          Through {BLACK_FRIDAY.endsLabel}, 11:59 PM PT. Enter the code at checkout. Pre-order:
          cancel any time before it ships.
        </p>
      </div>
    </div>
  )
}

/** Cart reminder: shown while the offer runs, so the code is not forgotten at checkout. */
export function BlackFridayCartNote() {
  const [show, setShow] = useState(false)
  useEffect(() => { setShow(blackFridayActive()) }, [])
  if (!show) return null
  return (
    <p className="bf-cart-note">
      <strong>Black Friday:</strong> enter <code>{BLACK_FRIDAY.code}</code> at checkout
      for ${BLACK_FRIDAY.amountOff} off. Ends {BLACK_FRIDAY.endsLabel}.
    </p>
  )
}
