import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { usd } from './bits'
import { productById, productBySlug } from '../data'
import { CONSENT_EVENT, getConsent } from '../consent'

// Below 620px the header's buy button is display:none and the mobile menu has
// no purchase action, so on a 14,000px-tall homepage a phone visitor could
// scroll the entire page without passing a way to buy. This restores one.
//
// It appears only after the hero has scrolled away, so it never covers the
// hero's own call to action, and it is suppressed anywhere it would be noise or
// a duplicate.

const HIDE_ON = ['/cart', '/checkout', '/account', '/dashboard', '/order-status', '/404']

export default function StickyBuyBar() {
  const { pathname } = useLocation()
  // Layout sits above the :slug route, so useParams() cannot see it from here.
  const slug = pathname.startsWith('/shop/p/') ? pathname.split('/shop/p/')[1]?.split('/')[0] : null
  const [shown, setShown] = useState(false)
  // The consent banner is also fixed to the bottom and demands an answer, so
  // this yields to it rather than stacking two bars on a small screen.
  const [bannerUp, setBannerUp] = useState(false)

  useEffect(() => {
    const sync = () => setBannerUp(!getConsent().decided)
    sync()
    window.addEventListener(CONSENT_EVENT, sync)
    return () => window.removeEventListener(CONSENT_EVENT, sync)
  }, [])

  useEffect(() => {
    // Roughly one viewport: past this the hero CTA is gone. clientHeight tracks
    // the CSS viewport, which window.innerHeight does not under zoom or
    // device emulation.
    const onScroll = () => {
      const doc = document.documentElement
      const viewport = doc.clientHeight || window.innerHeight || 0
      const y = window.scrollY || doc.scrollTop || 0
      setShown(y > viewport * 0.9)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [pathname])

  const hidden = HIDE_ON.some((p) => pathname.startsWith(p))
  if (hidden || !shown || bannerUp) return null

  // On a product page the bar refers to that product and takes you back to its
  // buy controls; anywhere else it points at the single tracker.
  const onProduct = Boolean(slug)
  const product = (onProduct && productBySlug(slug)) || productById('sponge-clip')
  if (!product || product.hidden) return null

  const soldOut = Boolean(product.soldOut)

  return (
    <div className="buybar" role="region" aria-label="Buy Sponge">
      <div className="buybar__info">
        <span className="buybar__name">{product.name}</span>
        <span className="buybar__meta">
          {soldOut ? 'Sold out' : <>{usd(product.price)} + shipping &amp; tax · Pre-order</>}
        </span>
      </div>
      {soldOut ? (
        <Link to="/products" className="btn btn--ghost buybar__cta">See what&rsquo;s available</Link>
      ) : onProduct ? (
        <a href="#buy" className="btn btn--primary buybar__cta">Pre-order</a>
      ) : (
        <Link to={`/shop/p/${product.slug}`} className="btn btn--primary buybar__cta">Pre-order</Link>
      )}
    </div>
  )
}
