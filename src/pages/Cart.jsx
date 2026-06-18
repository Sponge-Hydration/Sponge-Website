import { Link } from 'react-router-dom'
import { useSEO } from '../components/useSEO'
import { usd } from '../components/bits'
import { useCart } from '../cart/CartContext'

export default function Cart() {
  useSEO({ title: 'Your Cart | Sponge Hydration', description: 'Review your Sponge order before checkout.', path: '/cart' })
  const { items, subtotal, setQty, remove } = useCart()

  if (items.length === 0) {
    return (
      <section className="section">
        <div className="container empty-state">
          <div className="empty-state__emoji">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Add a Sponge hydration tracker to get started.</p>
          <Link to="/products" className="btn btn--primary btn--lg">Shop Sponge</Link>
        </div>
      </section>
    )
  }

  const shipping = 0
  const total = subtotal + shipping

  return (
    <section className="section">
      <div className="container">
        <h1 className="page-title">Your cart</h1>
        <div className="cart-layout">
          <div className="cart-items">
            {items.map((i) => (
              <div className="cart-row" key={i.id}>
                <div className="cart-row__media" aria-hidden="true">{i.emoji}</div>
                <div className="cart-row__info">
                  <Link to={`/shop/p/${i.slug}`} className="cart-row__name">{i.name}</Link>
                  <span className="cart-row__sub">{i.tagline}</span>
                  <button className="link-btn" onClick={() => remove(i.id)}>Remove</button>
                </div>
                <div className="qty qty--sm">
                  <button onClick={() => setQty(i.id, i.qty - 1)} aria-label="Decrease quantity">−</button>
                  <span>{i.qty}</span>
                  <button onClick={() => setQty(i.id, i.qty + 1)} aria-label="Increase quantity">+</button>
                </div>
                <div className="cart-row__price">{usd(i.lineTotal)}</div>
              </div>
            ))}
          </div>

          <aside className="cart-summary">
            <h3>Order summary</h3>
            <div className="cart-summary__row"><span>Subtotal</span><span>{usd(subtotal)}</span></div>
            <div className="cart-summary__row"><span>Shipping</span><span>Free</span></div>
            <div className="cart-summary__row cart-summary__total"><span>Total</span><span>{usd(total)}</span></div>
            <Link to="/checkout" className="btn btn--primary btn--lg btn--block">Checkout</Link>
            <Link to="/products" className="cart-summary__cont">← Continue shopping</Link>
            <p className="cart-summary__note">🛡️ 30-day money-back guarantee · Ships in ~8 weeks</p>
          </aside>
        </div>
      </div>
    </section>
  )
}
