import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useSEO } from '../components/useSEO'
import { Stars, usd } from '../components/bits'
import { PhoneIcon, ShieldIcon, TruckIcon } from '../components/icons'
import { productBySlug } from '../data'
import { useCart } from '../cart/CartContext'

export default function ProductDetail() {
  const { slug } = useParams()
  const product = productBySlug(slug)
  const { add } = useCart()
  const navigate = useNavigate()
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const gallery = product?.gallery?.length ? product.gallery : product?.img ? [product.img] : []
  const [activeImg, setActiveImg] = useState(0)

  useSEO({
    title: product
      ? `${product.name} — ${usd(product.price)} | Sponge Hydration Tracker`
      : 'Product not found | Sponge',
    description: product
      ? `${product.short} ${product.ships}. Free app, 8-day battery, 30-day money-back guarantee.`
      : 'This product could not be found.',
    path: `/shop/p/${slug || ''}`,
  })

  if (!product) {
    return (
      <section className="section">
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
            <div className="pdp__rating"><Stars small /> <span>4.9 · 120 reviews</span></div>

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

            <div className="pdp__buy">
              <div className="qty">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button>
                <span aria-live="polite">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} aria-label="Increase quantity">+</button>
              </div>
              <button className="btn btn--primary btn--lg" onClick={buyNow}>Order now — {usd(product.price * qty)}</button>
              <button className="btn btn--ghost btn--lg" onClick={addToCart}>
                {added ? '✓ Added to cart' : 'Add to cart'}
              </button>
            </div>

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
