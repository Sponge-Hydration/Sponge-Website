import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export function Stars({ small }) {
  return (
    <span className="stars" style={small ? { fontSize: 15 } : undefined} aria-label="4.9 out of 5 stars">
      ★★★★★
    </span>
  )
}

export function SectionHead({ eyebrow, title, children }) {
  return (
    <div className="section-head">
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2>{title}</h2>
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
