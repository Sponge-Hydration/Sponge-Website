import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Seo } from '../components/useSEO'
import { usd } from '../components/bits'
import { PhoneIcon, ShieldIcon, TruckIcon } from '../components/icons'
import { productBySlug } from '../data'
import { useCart } from '../cart/CartContext'

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

  const addToCart = () => {
    add(product.id, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 2200)
  }
  const buyNow = () => {
    add(product.id, qty)
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
                    aria-label={`View image ${i + 1}`}
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
                </span>
              )}
            </div>

            <p className="pdp__desc">{product.short}</p>

            <ul className="checklist pdp__list">
              {product.features.map((f) => (
                <li key={f}><span className="tick">✓</span> {f}</li>
              ))}
            </ul>

            {product.soldOut ? (
              <div className="pdp__buy">
                <button className="btn btn--primary btn--lg" disabled>Sold out</button>
                <Link to="/contact" className="btn btn--ghost btn--lg">Ask about availability</Link>
              </div>
            ) : (
              <div className="pdp__buy">
                <div className="qty">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button>
                  <span aria-live="polite">{qty}</span>
                  <button onClick={() => setQty((q) => q + 1)} aria-label="Increase quantity">+</button>
                </div>
                <button className="btn btn--primary btn--lg" onClick={buyNow}>Order now - {usd(product.price * qty)}</button>
                <button className="btn btn--ghost btn--lg" onClick={addToCart}>
                  {added ? '✓ Added to cart' : 'Add to cart'}
                </button>
              </div>
            )}

            <div className="pdp__meta">
              <span><TruckIcon size={15} /> {product.ships}</span>
              <span><ShieldIcon size={15} /> 30-day money-back guarantee</span>
              <span><PhoneIcon size={15} /> Free iOS &amp; Android app included</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
