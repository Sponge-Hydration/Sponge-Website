import { Link, useNavigate } from 'react-router-dom'
import { Seo } from '../components/useSEO'
import { SectionHead, usd } from '../components/bits'
import { visibleProducts } from '../data'
import { useCart } from '../cart/CartContext'

export default function Products() {
  const { add } = useCart()
  const navigate = useNavigate()

  const buyNow = (id) => {
    add(id, 1)
    navigate('/cart')
  }

  return (
    <section className="section">
      <Seo
        title="Shop the Sponge Hydration Tracker | Single, Family Pack & Accessories"
        description="Order the Sponge hydration tracking device. Choose a single tracker or the family pack with a shared dashboard, and add magnetic adhesive mounts for every bottle. Free app, 8-day battery, 30-day guarantee."
        path="/products"
      />
      <div className="container">
        <SectionHead eyebrow="Shop" title="Choose your Sponge">
          Every option includes the free iOS &amp; Android app, app-lock, an 8-day battery, and a
          30-day money-back guarantee.
        </SectionHead>

        <div className="features">
          {visibleProducts.map((p) => (
            <article className="product-card" key={p.id}>
              <div className="product-card__badge">{p.badge}</div>
              <Link to={`/shop/p/${p.slug}`} className="product-card__media">
                <img src={p.img} alt={p.name} loading="lazy" />
              </Link>
              <div className="product-card__body">
                <h3><Link to={`/shop/p/${p.slug}`}>{p.name}</Link></h3>
                <p>{p.short}</p>
                <div className="product-card__price">
                  <strong>{usd(p.price)}</strong>
                  {p.compareAt && <s>{usd(p.compareAt)}</s>}
                </div>
                <div className="product-card__actions">
                  {p.soldOut ? (
                    <button className="btn btn--primary btn--block" disabled>
                      Sold out
                    </button>
                  ) : (
                    <button className="btn btn--primary btn--block" onClick={() => buyNow(p.id)}>
                      Order now
                    </button>
                  )}
                  <Link to={`/shop/p/${p.slug}`} className="btn btn--ghost btn--block">Details</Link>
                </div>
                <div className="product-card__ship">{p.ships}</div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
