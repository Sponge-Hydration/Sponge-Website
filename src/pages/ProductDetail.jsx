import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Seo } from '../components/useSEO'
import { usd } from '../components/bits'
import { PhoneIcon, ShieldIcon, TruckIcon } from '../components/icons'
import { colorById, colorOptions, productBySlug } from '../data'
import { useCart } from '../cart/CartContext'
import { trackAddToCart, trackViewItem } from '../analytics'
import EmailSignup from '../components/EmailSignup'

// "View image 3" tells a screen reader user nothing about what they would be
// looking at. Derive a description from the filename, which already encodes the
// shot, and fall back to a position only when it does not.
const THUMB_LABELS = [
  [/-white-/, 'White tracker, front view'],
  [/-black-/, 'Black tracker, front view'],
  [/side-profile/, 'Side profile, showing thickness'],
  [/on-bottle/, 'Attached to the base of a bottle'],
  [/closeup/, 'Close-up of the status light and USB-C port'],
  [/packaging/, 'What comes in the box'],
]
function thumbLabel(src, i) {
  const hit = THUMB_LABELS.find(([re]) => re.test(src))
  return hit ? hit[1] : `Product image ${i + 1}`
}

export default function ProductDetail() {
  const { slug } = useParams()
  const found = productBySlug(slug)
  // Hidden SKUs are not for sale, treat them like they don't exist.
  const product = found && !found.hidden ? found : null
  const { add } = useCart()
  const navigate = useNavigate()
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const gallery = product?.gallery?.length ? product.gallery : product?.img ? [product.img] : []
  const [activeImg, setActiveImg] = useState(0)
  // Colour is chosen here rather than only in the cart, so nobody buys a
  // silently-defaulted variant. White is first in the gallery and is the colour
  // most of the product photography shows.
  const [color, setColor] = useState('white')

  // Declared before the not-found early return so hook order stays stable.
  useEffect(() => {
    if (product) {
      trackViewItem({ id: product.id, name: product.name, price: product.price, qty: 1 })
    }
  }, [product?.id])

  if (!product) {
    return (
      <section className="section">
        <Seo title="Product not found | Sponge" description="This product could not be found." path={`/shop/p/${slug || ''}`} noindex />
        <div className="container" style={{ textAlign: 'center' }}>
          <h2>Product not found</h2>
          <p style={{ color: 'var(--ink-soft)' }}>We couldn’t find that product.</p>
          <Link to="/products" className="btn btn--primary">Back to shop</Link>
        </div>
      </section>
    )
  }

  // One colour chosen here is applied to every clip in the item; multi-clip
  // products stay individually editable in the cart.
  const clips = product.clips ?? 1
  const colorsForCart = clips > 0 ? Array.from({ length: clips }, () => color) : null

  const addToCart = () => {
    add(product.id, qty, colorsForCart)
    trackAddToCart({ id: product.id, name: product.name, price: product.price, qty })
    setAdded(true)
    setTimeout(() => setAdded(false), 2200)
  }
  const buyNow = () => {
    add(product.id, qty, colorsForCart)
    trackAddToCart({ id: product.id, name: product.name, price: product.price, qty })
    navigate('/cart')
  }

  return (
    <section className="section">
      <Seo
        title={`${product.name} - ${usd(product.price)} | Sponge Hydration Tracker`}
        description={`${product.short} ${product.ships}. Free app, 8-day battery, 30-day money-back guarantee.`}
        path={`/shop/p/${product.slug}`}
      />
      <div className="container">
        <div className="breadcrumb">
          <Link to="/products">Shop</Link> <span>/</span> {product.name}
        </div>

        <div className="pdp">
          <div className="pdp__gallery">
            <div className="pdp__main">
              <img src={gallery[activeImg]} alt={product.name} />
            </div>
            {gallery.length > 1 && (
              <div className="pdp__thumbs">
                {gallery.map((src, i) => (
                  <button
                    key={src}
                    className={`pdp__thumb${i === activeImg ? ' is-active' : ''}`}
                    onClick={() => setActiveImg(i)}
                    aria-label={thumbLabel(src, i)}
                    aria-current={i === activeImg || undefined}
                  >
                    <img src={src} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pdp__info">
            <span className="eyebrow">{product.badge}</span>
            <h1>{product.name}</h1>
            <p className="pdp__tagline">{product.tagline}</p>

            <div className="pdp__price">
              <strong>{usd(product.price)}</strong>
              {product.compareAt && <s>{usd(product.compareAt)}</s>}
              {product.compareAt && (
                <span className="pdp__save">
                  Save {usd(product.compareAt - product.price)}
                  {product.compareNote ? ` ${product.compareNote}` : ''}
                </span>
              )}
              {!product.soldOut && <span className="pdp__plus">+ shipping &amp; tax</span>}
            </div>
            {product.clips === 1 && (
              <p className="pdp__compare">
                Smart bottles start around $80 and ask you to replace the bottle you already
                own. Sponge clips onto it.
              </p>
            )}

            <p className="pdp__desc">{product.short}</p>

            <ul className="checklist pdp__list">
              {product.features.map((f) => (
                <li key={f}><span className="tick">✓</span> {f}</li>
              ))}
            </ul>

            {!product.soldOut && clips > 0 && (
              <div className="pdp__colors">
                <span className="pdp__colors-label" id="pdp-color-label">
                  Colour: <strong>{colorById(color)?.label}</strong>
                  {clips > 1 && <span className="pdp__colors-note"> — change individual clips in the cart</span>}
                </span>
                <div className="pdp__swatches" role="radiogroup" aria-labelledby="pdp-color-label">
                  {colorOptions.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      role="radio"
                      aria-checked={color === c.id}
                      aria-label={c.label}
                      title={c.label}
                      className={`swatch swatch--lg${color === c.id ? ' is-active' : ''}`}
                      style={{ '--swatch': c.hex }}
                      onClick={() => {
                        setColor(c.id)
                        // Follow the choice in the gallery when a matching shot exists.
                        const i = gallery.findIndex((g) => g.includes(`-${c.id}-`))
                        if (i >= 0) setActiveImg(i)
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {product.soldOut ? (
              <div className="pdp__soldout">
                <button className="btn btn--primary btn--lg" disabled>Sold out</button>
                <div className="pdp__notify">
                  <EmailSignup
                    source="notify-product"
                    label={`Email me when the ${product.name} is back`}
                    cta="Notify me"
                    done="Thanks — we’ll email you when it’s back in stock."
                  />
                </div>
              </div>
            ) : (
              <div className="pdp__buy">
                <div className="qty">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button>
                  <span aria-live="polite">{qty}</span>
                  <button onClick={() => setQty((q) => q + 1)} aria-label="Increase quantity">+</button>
                </div>
                <button className="btn btn--primary btn--lg" onClick={buyNow}>Pre-order — {usd(product.price * qty)}</button>
                <button className="btn btn--ghost btn--lg" onClick={addToCart}>
                  {added ? '✓ Added to cart' : 'Add to cart'}
                </button>
              </div>
            )}

            <div className="pdp__meta">
              <span><TruckIcon size={15} /> {product.ships}</span>
              <span><ShieldIcon size={15} /> <Link to="/legal/pre-order">Cancel any time before it ships</Link></span>
              <span><ShieldIcon size={15} /> 30-day money-back guarantee from delivery</span>
              <span><PhoneIcon size={15} /> Free iOS &amp; Android app included</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
