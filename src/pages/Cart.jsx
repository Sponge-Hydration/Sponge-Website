import { Link } from 'react-router-dom'
import { useSEO } from '../components/useSEO'
import { usd } from '../components/bits'
import { useCart } from '../cart/CartContext'
import { colorOptions, productById } from '../data'

export default function Cart() {
  useSEO({ title: 'Your Cart | Sponge Hydration', description: 'Review your Sponge order before checkout.', path: '/cart' })
  const { items, subtotal, add, setColor, remove } = useCart()

  // Upsell: nudge customers with 2+ single clips toward the cheaper 2-Pack.
  const single = productById('sponge-clip')
  const twoPack = productById('sponge-2pack')
  const singleUnits = items.filter((i) => i.id === 'sponge-clip')
  const pairs = Math.floor(singleUnits.length / 2)
  const packSavings = single && twoPack ? pairs * (single.price * 2 - twoPack.price) : 0
  const switchToTwoPack = () => {
    const convert = singleUnits.slice(0, pairs * 2)
    convert.forEach((u) => remove(u.uid))
    // Lossless: each 2-Pack keeps both clips' chosen colors.
    for (let p = 0; p < pairs; p++) {
      add('sponge-2pack', 1, [convert[p * 2].colors[0], convert[p * 2 + 1].colors[0]])
    }
  }

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
            {pairs >= 1 && (
              <div className="cart-upsell">
                <span className="cart-upsell__text">
                  💡 Switch {pairs > 1 ? `${pairs} pairs` : 'your pair'} of single clips to the
                  2-Pack and save <strong>{usd(packSavings)}</strong>.
                </span>
                <button type="button" className="btn btn--primary btn--sm" onClick={switchToTwoPack}>
                  Switch to 2-Pack
                </button>
              </div>
            )}
            {items.map((i) => (
              <div className="cart-row" key={i.uid}>
                <div className="cart-row__media" aria-hidden="true">{i.emoji}</div>
                <div className="cart-row__info">
                  <Link to={`/shop/p/${i.slug}`} className="cart-row__name">{i.name}</Link>
                  <span className="cart-row__sub">{i.tagline}</span>
                  <div className="cart-row__colors-group">
                    <span className="cart-row__colors-heading">
                      Select color{i.colors.length > 1 ? 's' : ''}:
                    </span>
                    {i.colors.map((selected, idx) => (
                      <div
                        className="cart-row__colors"
                        key={idx}
                        role="radiogroup"
                        aria-label={i.colors.length > 1 ? `Clip ${idx + 1} color` : `Color for ${i.name}`}
                      >
                        {i.colors.length > 1 && (
                          <span className="cart-row__clip-label">Clip {idx + 1}</span>
                        )}
                        {colorOptions.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            role="radio"
                            aria-checked={selected === c.id}
                            aria-label={c.label}
                            title={c.label}
                            className={`swatch${selected === c.id ? ' is-active' : ''}`}
                            style={{ '--swatch': c.hex }}
                            onClick={() => setColor(i.uid, idx, c.id)}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                  <div className="cart-row__actions">
                    <button className="link-btn" onClick={() => add(i.id, 1)}>+ Add another</button>
                    <button className="link-btn link-btn--muted" onClick={() => remove(i.uid)}>Remove</button>
                  </div>
                </div>
                <div className="cart-row__price">{usd(i.lineTotal)}</div>
              </div>
            ))}
          </div>

          <aside className="cart-summary">
            <h3>Order summary</h3>
            <div className="cart-summary__row"><span>Items</span><span>{items.length}</span></div>
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
