import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Seo } from '../components/useSEO'
import { usd } from '../components/bits'
import { useCart } from '../cart/CartContext'
import { CartIcon, CheckCircleIcon, LockIcon, ShieldIcon } from '../components/icons'

export default function Checkout() {
  const { items, subtotal, clear } = useCart()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const success = searchParams.get('status') === 'success'

  // Clear the cart once we return from a successful Stripe Checkout.
  useEffect(() => {
    if (success) {
      clear()
      window.scrollTo(0, 0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success])

  if (success) {
    return (
      <section className="section">
        <Seo title="Checkout | Sponge Hydration" description="Complete your Sponge pre-order." path="/checkout" noindex />
        <div className="container empty-state">
          <div className="empty-state__icon" aria-hidden="true"><CheckCircleIcon size={56} /></div>
          <h2>Order confirmed!</h2>
          <p>
            Thanks for pre-ordering Sponge. Payment received — we’ve sent a confirmation to your
            email. Your hydration tracker ships in about 8 weeks.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 }}>
            <button className="btn btn--primary btn--lg" onClick={() => navigate('/dashboard')}>Open your dashboard</button>
            <Link to="/" className="btn btn--ghost btn--lg">Back to home</Link>
          </div>
        </div>
      </section>
    )
  }

  if (items.length === 0) {
    return (
      <section className="section">
        <Seo title="Checkout | Sponge Hydration" description="Complete your Sponge pre-order." path="/checkout" noindex />
        <div className="container empty-state">
          <div className="empty-state__icon" aria-hidden="true"><CartIcon size={56} /></div>
          <h2>Nothing to check out</h2>
          <p>Your cart is empty.</p>
          <Link to="/products" className="btn btn--primary btn--lg">Shop Sponge</Link>
        </div>
      </section>
    )
  }

  const payWithStripe = async () => {
    setLoading(true)
    setError('')
    try {
      // Group units by product + exact color combo into { id, colors, qty } lines.
      const grouped = Object.values(
        items.reduce((acc, i) => {
          const key = `${i.id}|${i.colors.join(',')}`
          if (!acc[key]) acc[key] = { id: i.id, colors: i.colors, qty: 0 }
          acc[key].qty += 1
          return acc
        }, {})
      )
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ items: grouped }),
      })
      const raw = await res.text()
      let data
      try {
        data = JSON.parse(raw)
      } catch {
        throw new Error(
          'The checkout API did not respond. Make sure the site is served via Cloudflare (e.g. `wrangler pages dev`), not plain Vite.'
        )
      }
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Could not start checkout.')
      }
      window.location.href = data.url
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <section className="section">
      <Seo title="Checkout | Sponge Hydration" description="Complete your Sponge pre-order." path="/checkout" noindex />
      <div className="container">
        <h1 className="page-title">Checkout</h1>
        <div className="checkout-layout">
          <div className="checkout-form">
            <fieldset>
              <legend>Secure payment</legend>
              <p>
                You’ll be redirected to Stripe’s secure checkout to enter your contact, shipping,
                and payment details. We never see or store your card information.
              </p>
              {error && <p style={{ color: 'crimson' }}>{error}</p>}
              <button
                type="button"
                className="btn btn--primary btn--lg btn--block"
                onClick={payWithStripe}
                disabled={loading}
              >
                {loading ? 'Redirecting…' : `Pay with card — ${usd(subtotal)}`}
              </button>
              <p className="checkout-form__demo"><LockIcon size={14} /> Payments are processed securely by Stripe.</p>
            </fieldset>
          </div>

          <aside className="cart-summary">
            <h3>Order summary</h3>
            {items.map((i) => (
              <div className="cart-summary__line" key={i.id}>
                <span>{i.name} × {i.qty}</span>
                <span>{usd(i.lineTotal)}</span>
              </div>
            ))}
            <div className="cart-summary__row"><span>Shipping</span><span>Free</span></div>
            <div className="cart-summary__row cart-summary__total"><span>Total</span><span>{usd(subtotal)}</span></div>
            <p className="cart-summary__note"><ShieldIcon size={14} /> 30-day money-back guarantee · Ships in ~8 weeks</p>
          </aside>
        </div>
      </div>
    </section>
  )
}
