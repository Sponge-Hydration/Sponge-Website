import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Seo } from '../components/useSEO'
import { usd } from '../components/bits'
import { useCart } from '../cart/CartContext'
import { colorOptions, productById } from '../data'
import { BulbIcon, CartIcon, ShieldIcon } from '../components/icons'
import { shippingForCart } from '../shipping'

export default function Cart() {
  const { items, subtotal, add, setColor, remove } = useCart()

  // The cart stores one unit per row so each clip can carry its own colour.
  // Presenting that raw means four trackers render as four identical rows, so
  // collapse units that are the same product AND the same colour combination
  // into a single row with a quantity stepper.
  const groups = useMemo(() => {
    const map = new Map()
    for (const i of items) {
      const key = `${i.id}|${i.colors.join(',')}`
      if (!map.has(key)) map.set(key, { key, item: i, uids: [], qty: 0 })
      const g = map.get(key)
      g.uids.push(i.uid)
      g.qty += 1
    }
    return [...map.values()]
  }, [items])

  // Cross-sell: the adhesive mounts are what make "swap between bottles" work,
  // so offer them once there is a clip in the cart and none already added.
  const adhesive = productById('sponge-adhesive-3pack')
  const hasClips = items.some((i) => (i.clips ?? 0) > 0)
  const hasAdhesive = items.some((i) => i.id === 'sponge-adhesive-3pack')
  const showAdhesiveOffer = Boolean(adhesive) && hasClips && !hasAdhesive && !adhesive.soldOut

  // Show the real USPS charge here rather than deferring it to /checkout — the
  // shipping model is deterministic from the cart contents, so hiding it until
  // the payment step just turns a known cost into a surprise.
  const shipping = shippingForCart(items)
  const total = subtotal + shipping

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
            {groups.map((g) => (
              <div className="cart-row" key={g.key}>
                <div className="cart-row__media" aria-hidden="true"><img src={g.item.img} alt="" loading="lazy" /></div>
                <div className="cart-row__info">
                  <Link to={`/shop/p/${g.item.slug}`} className="cart-row__name">{g.item.name}</Link>
                  <span className="cart-row__sub">{g.item.tagline}</span>
                  {g.item.colors.length > 0 && (
                  <div className="cart-row__colors-group">
                    <span className="cart-row__colors-heading">
                      Select color{g.item.colors.length > 1 ? 's' : ''}:
                    </span>
                    {g.item.colors.map((selected, idx) => (
                      <div
                        className="cart-row__colors"
                        key={idx}
                        role="radiogroup"
                        aria-label={g.item.colors.length > 1 ? `Clip ${idx + 1} color` : `Color for ${g.item.name}`}
                      >
                        {g.item.colors.length > 1 && (
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
                            // The units in a group are identical by definition,
                            // so a colour change applies to all of them and the
                            // group stays a single row.
                            onClick={() => g.uids.forEach((uid) => setColor(uid, idx, c.id))}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                  )}
                  <div className="cart-row__actions">
                    <div className="qty qty--sm">
                      <button
                        onClick={() => remove(g.uids[g.uids.length - 1])}
                        aria-label={`Decrease ${g.item.name} quantity`}
                        disabled={g.qty <= 1}
                      >
                        −
                      </button>
                      <span aria-live="polite">{g.qty}</span>
                      <button
                        onClick={() => add(g.item.id, 1, g.item.colors)}
                        aria-label={`Increase ${g.item.name} quantity`}
                      >
                        +
                      </button>
                    </div>
                    <button
                      className="link-btn link-btn--muted"
                      onClick={() => g.uids.forEach((uid) => remove(uid))}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div className="cart-row__price">{usd(g.item.price * g.qty)}</div>
              </div>
            ))}

            {showAdhesiveOffer && (
              <div className="cart-addon">
                <div className="cart-addon__media" aria-hidden="true">
                  <img src={adhesive.img} alt="" loading="lazy" />
                </div>
                <div className="cart-addon__info">
                  <span className="cart-addon__name">Add the {adhesive.name}</span>
                  <span className="cart-addon__sub">
                    Stick one on each bottle you use and swap your Sponge between them in seconds.
                  </span>
                </div>
                <div className="cart-addon__action">
                  <span className="cart-addon__price">{usd(adhesive.price)}</span>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => add(adhesive.id, 1)}
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>

          <aside className="cart-summary">
            <h3>Order summary</h3>
            <div className="cart-summary__row"><span>Items</span><span>{items.length}</span></div>
            <div className="cart-summary__row"><span>Subtotal</span><span>{usd(subtotal)}</span></div>
            <div className="cart-summary__row"><span>Shipping (USPS Ground)</span><span>{shipping === 0 ? 'Free' : usd(shipping)}</span></div>
            <div className="cart-summary__row"><span>Sales tax</span><span>Calculated at checkout</span></div>
            <div className="cart-summary__row cart-summary__total"><span>Total</span><span>{usd(total)} + tax</span></div>
            <Link to="/checkout" className="btn btn--primary btn--lg btn--block">Checkout</Link>
            <Link to="/products" className="cart-summary__cont">← Continue shopping</Link>
            <p className="cart-summary__note"><ShieldIcon size={14} /> Pre-order · Cancel any time before it ships for a full refund</p>
          </aside>
        </div>
      </div>
    </section>
  )
}
