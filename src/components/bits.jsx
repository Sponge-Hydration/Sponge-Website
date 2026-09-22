import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

/**
 * `as` defaults to h2, which is right for a section inside a page that already
 * has an h1. Pages that use this as their *page title* must pass as="h1",
 * otherwise their document outline starts at level 2 with no h1 at all.
 *
 * `eyebrowTo` turns the eyebrow pill into a link. Only give it one when the
 * destination tells the visitor more about that section — never the checkout.
 */
export function SectionHead({ eyebrow, eyebrowTo, title, children, as: Heading = 'h2' }) {
  return (
    <div className="section-head">
      {eyebrow && <Eyebrow to={eyebrowTo}>{eyebrow}</Eyebrow>}
      <Heading>{title}</Heading>
      {children && <p>{children}</p>}
    </div>
  )
}

export function Eyebrow({ to, children }) {
  if (!to) return <span className="eyebrow">{children}</span>
  return (
    <Link to={to} className="eyebrow eyebrow--link">
      {children}
      <span className="eyebrow__arrow" aria-hidden="true">→</span>
    </Link>
  )
}

export function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    // A link to /page#section should land on that section, not the top of the
    // page. Deferred a frame so the target has rendered (and, for an FAQ answer,
    // opened) before we measure where it is.
    if (hash) {
      const id = decodeURIComponent(hash.slice(1))
      const raf = requestAnimationFrame(() => {
        const el = document.getElementById(id)
        if (el) el.scrollIntoView({ block: 'start' })
        else window.scrollTo(0, 0)
      })
      return () => cancelAnimationFrame(raf)
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

export const usd = (n) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
