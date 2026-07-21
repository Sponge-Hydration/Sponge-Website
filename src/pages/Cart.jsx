import { Link } from 'react-router-dom'
import { Seo } from '../components/useSEO'
import { usd } from '../components/bits'
import { useCart } from '../cart/CartContext'
import { colorOptions, productById } from '../data'
import { BulbIcon, CartIcon, ShieldIcon } from '../components/icons'

export default function Cart() {
  const { items, subtotal, add, setColor, remove } = useCart()

  // Upsell: nudge customers with 4+ single clips toward the cheaper Family Pack.
  const single = productById('sponge-clip')
  const familyPack = productById('sponge-family')
  const singleUnits = items.filter((i) => i.id === 'sponge-clip')
  const quads = Math.floor(singleUnits.length / 4)
  const packSavings = single && familyPack ? quads * (single.price * 4 - familyPack.price) : 0
  const switchToFamilyPack = () => {
    const convert = singleUnits.slice(0, quads * 4)
    convert.forEach((u) => remove(u.uid))
    // Lossless: each Family Pack keeps all four clips' chosen colors.
    for (let q = 0; q < quads; q++) {
      add('sponge-family', 1, [
        convert[q * 4].colors[0],
        convert[q * 4 + 1].colors[0],
        convert[q * 4 + 2].colors[0],
        convert[q * 4 + 3].colors[0],
      ])
    }
  }

  if (items.length === 0) {
    return (
      <section className="section">
        <Seo title="Your Cart | Sponge Hydration" description="Review your Sponge order before checkout." path="/cart" noindex />
        <div className="container empty-state">
          <div className="empty-state__icon" aria-hidden="true"><CartIcon size={56} /></div>
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
      <Seo title="Your Cart | Sponge Hydration" description="Review your Sponge order before checkout." path="/cart" noindex />
      <div className="container">
        <h1 className="page-title">Your cart</h1>
        <div className="cart-layout">
          <div className="cart-items">
            {quads >= 1 && (
              <div className="cart-upsell">
                <span className="cart-upsell__text">
                  <BulbIcon size={15} /> Switch {quads > 1 ? `${quads} sets of four` : 'your four'} single clips to the
                  Family Pack and save <strong>{usd(packSavings)}</strong>.
                </span>
                <button type="button" className="btn btn--primary btn--sm" onClick={switchToFamilyPack}>
                  Switch to Family Pack
                </button>
              </div>
            )}
            {items.map((i) => (
              <div className="cart-row" key={i.uid}>
                <div className="cart-row__media" aria-hidden="true"><img src={i.img} alt="" loading="lazy" /></div>
                <div className="cart-row__info">
                  <Link to={`/shop/p/${i.slug}`} className="cart-row__name">{i.name}</Link>
                  <span className="cart-row__sub">{i.tagline}</span>
                  {i.colors.length > 0 && (
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
                  )}
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
            <p className="cart-summary__note"><ShieldIcon size={14} /> 30-day money-back guarantee · Ships in ~8 weeks</p>
          </aside>
        </div>
      </div>
    </section>
  )
}
