import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * `as` defaults to h2, which is right for a section inside a page that already
 * has an h1. Pages that use this as their *page title* must pass as="h1",
 * otherwise their document outline starts at level 2 with no h1 at all.
 */
export function SectionHead({ eyebrow, title, children, as: Heading = 'h2' }) {
  return (
    <div className="section-head">
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <Heading>{title}</Heading>
      {children && <p>{children}</p>}
    </div>
  )
}

export function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export const usd = (n) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
