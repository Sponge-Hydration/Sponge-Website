import { useNavigate } from 'react-router-dom'
import { useCart } from './CartContext'
import { productById } from '../data'
import { trackAddToCart } from '../analytics'
import { priceFor } from '../pricing'

// Fired by the sticky buy bar on a product page; ProductDetail listens and runs
// its own buy action, so the chosen color and quantity are respected.
export const BUY_NOW_EVENT = 'sponge:buynow'

/**
 * The one "Order now" behavior, used by every Order now button outside a
 * product page: put the product in the cart and go to the cart.
 *
 * If one is already in the cart it is not added again, so tapping Order now
 * twice (header, then hero) doesn't quietly double the order.
 */
export function useOrderNow(productId = 'sponge-clip') {
  const { items, add } = useCart()
  const navigate = useNavigate()
  return () => {
    if (!items.some((i) => i.id === productId)) {
      add(productId, 1)
      const p = productById(productId)
      // priceFor: the Tracker's price depends on the visitor's A/B arm.
      if (p) trackAddToCart({ id: p.id, name: p.name, price: priceFor(p), qty: 1 })
    }
    navigate('/cart')
  }
}
