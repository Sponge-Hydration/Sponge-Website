import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSEO } from '../components/useSEO'
import { usd } from '../components/bits'
import { useCart } from '../cart/CartContext'

export default function Checkout() {
  useSEO({ title: 'Checkout | Sponge Hydration', description: 'Complete your Sponge pre-order.', path: '/checkout' })
  const { items, subtotal, clear } = useCart()
  const navigate = useNavigate()
  const [placed, setPlaced] = useState(false)
  const [orderNo] = useState(() => 'SPNG-' + Math.floor(100000 + Math.random() * 900000))

  if (items.length === 0 && !placed) {
    return (
      <section className="section">
        <div className="container empty-state">
          <div className="empty-state__emoji">🛒</div>
          <h2>Nothing to check out</h2>
          <p>Your cart is empty.</p>
          <Link to="/products" className="btn btn--primary btn--lg">Shop Sponge</Link>
        </div>
      </section>
    )
  }

  const submit = (e) => {
    e.preventDefault()
    setPlaced(true)
    clear()
    window.scrollTo(0, 0)
  }

  if (placed) {
    return (
      <section className="section">
        <div className="container empty-state">
          <div className="empty-state__emoji">🎉</div>
          <h2>Order confirmed!</h2>
          <p>
            Thanks for pre-ordering Sponge. Your order <strong>{orderNo}</strong> is in — we’ve sent a
            confirmation to your email. Your hydration tracker ships in about 8 weeks.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 }}>
            <button className="btn btn--primary btn--lg" onClick={() => navigate('/dashboard')}>Open your dashboard</button>
            <Link to="/" className="btn btn--ghost btn--lg">Back to home</Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="section">
      <div className="container">
        <h1 className="page-title">Checkout</h1>
        <div className="checkout-layout">
          <form className="checkout-form" onSubmit={submit}>
            <fieldset>
              <legend>Contact</legend>
              <label>Email<input type="email" required placeholder="you@email.com" /></label>
            </fieldset>

            <fieldset>
              <legend>Shipping address</legend>
              <div className="form-row">
                <label>First name<input required placeholder="Jordan" /></label>
                <label>Last name<input required placeholder="Lee" /></label>
              </div>
              <label>Address<input required placeholder="123 Hydration Ave" /></label>
              <div className="form-row">
                <label>City<input required placeholder="Austin" /></label>
                <label>State<input required placeholder="TX" /></label>
                <label>ZIP<input required placeholder="78701" /></label>
              </div>
            </fieldset>

            <fieldset>
              <legend>Payment</legend>
              <label>Card number<input required inputMode="numeric" placeholder="4242 4242 4242 4242" /></label>
              <div className="form-row">
                <label>Expiry<input required placeholder="MM/YY" /></label>
                <label>CVC<input required inputMode="numeric" placeholder="123" /></label>
              </div>
              <p className="checkout-form__demo">🔒 Demo checkout — no real payment is processed and no card details are stored.</p>
            </fieldset>

            <button type="submit" className="btn btn--primary btn--lg btn--block">
              Place order — {usd(subtotal)}
            </button>
          </form>

          <aside className="cart-summary">
            <h3>Order summary</h3>
            {items.map((i) => (
              <div className="cart-summary__line" key={i.id}>
                <span>{i.emoji} {i.name} × {i.qty}</span>
                <span>{usd(i.lineTotal)}</span>
              </div>
            ))}
            <div className="cart-summary__row"><span>Shipping</span><span>Free</span></div>
            <div className="cart-summary__row cart-summary__total"><span>Total</span><span>{usd(subtotal)}</span></div>
            <p className="cart-summary__note">🛡️ 30-day money-back guarantee · Ships in ~8 weeks</p>
          </aside>
        </div>
      </div>
    </section>
  )
}
