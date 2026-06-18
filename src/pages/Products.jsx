import { Link, useNavigate } from 'react-router-dom'
import { useSEO } from '../components/useSEO'
import { SectionHead, Stars, usd } from '../components/bits'
import { products } from '../data'
import { useCart } from '../cart/CartContext'

export default function Products() {
  useSEO({
    title: 'Shop the Sponge Hydration Tracker | Single, 2-Pack & Family Pack',
    description:
      'Order the Sponge hydration tracking device. Choose a single tracker, a money-saving 2-pack, or the family pack with a shared dashboard. Free app, 8-day battery, 30-day guarantee.',
    path: '/products',
  })
  const { add } = useCart()
  const navigate = useNavigate()

  const buyNow = (id) => {
    add(id, 1)
    navigate('/cart')
  }

  return (
    <section className="section">
      <div className="container">
        <SectionHead eyebrow="Shop" title="Choose your Sponge">
          Every option includes the free iOS &amp; Android app, app-lock, an 8-day battery, and a
          30-day money-back guarantee.
        </SectionHead>

        <div className="features">
          {products.map((p) => (
            <article className="product-card" key={p.id}>
              <div className="product-card__badge">{p.badge}</div>
              <Link to={`/shop/p/${p.slug}`} className="product-card__media" aria-hidden="true">
                <span>{p.emoji}</span>
              </Link>
              <div className="product-card__body">
                <h3><Link to={`/shop/p/${p.slug}`}>{p.name}</Link></h3>
                <div className="product-card__rating"><Stars small /> <span>4.9 (120)</span></div>
                <p>{p.short}</p>
                <div className="product-card__price">
                  <strong>{usd(p.price)}</strong>
                  {p.compareAt && <s>{usd(p.compareAt)}</s>}
                </div>
                <div className="product-card__actions">
                  <button className="btn btn--primary btn--block" onClick={() => buyNow(p.id)}>
                    Order now
                  </button>
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
