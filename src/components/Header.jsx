import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useCart } from '../cart/CartContext'

const links = [
  { to: '/products', label: 'Products' },
  { to: '/caregivers', label: 'Caregivers' },
  { to: '/how-it-works', label: 'Setup & FAQ' },
  { to: '/blog', label: 'Blog' },
  { to: '/about', label: 'About' },
]

export default function Header() {
  const { count } = useCart()
  const [open, setOpen] = useState(false)

  return (
    <header className="header">
      <div className="container header__inner">
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <img className="brand__logo" src="/media/logo/mark.png" alt="" aria-hidden="true" />
          Sponge
        </Link>

        <nav className={`nav nav--links${open ? ' is-open' : ''}`} aria-label="Primary">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)}>
              {l.label}
            </NavLink>
          ))}
          <NavLink to="/dashboard" className="nav__dash" onClick={() => setOpen(false)}>
            Dashboard
          </NavLink>
        </nav>

        <div className="header__cta">
          <Link to="/cart" className="cart-btn" aria-label={`Cart, ${count} items`}>
            <span aria-hidden="true">🛒</span>
            {count > 0 && <span className="cart-badge">{count}</span>}
          </Link>
          <Link to="/products" className="btn btn--primary header__order">Order Now</Link>
          <button
            className="nav-toggle"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? '✕' : '☰'}
          </button>
        </div>
      </div>
    </header>
  )
}
