import { useState } from 'react'
import { useCart } from './CartContext'
import { cartShipping, getPriceVariant } from '../pricing'
import { trackBeginCheckout } from '../analytics'
import { getConsent } from '../consent'
import { isInternal } from '../internal'
import { clearGiftCode, getGiftCode } from '../gift'

/**
 * Starts Stripe hosted Checkout for the current cart and redirects to it.
 * Shared by the cart (which now goes straight to Stripe, one page fewer) and
 * the /checkout page (kept as a fallback entry point and the confirmation
 * screen).
 *
 * `start({ track: true })` also fires begin_checkout, for callers that are
 * themselves the start of checkout. /checkout fires it on mount instead.
 */
export function useStripeCheckout() {
  const { items, subtotal } = useCart()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const start = async ({ track = false } = {}) => {
    if (loading || items.length === 0) return
    setLoading(true)
    setError('')
    try {
      if (track) {
        const total = subtotal + cartShipping(items)
        trackBeginCheckout(
          items.map((i) => ({ id: i.id, name: i.name, price: i.price, qty: 1 })),
          Number(total.toFixed(2))
        )
      }
      // Group units by product + exact color combo into { id, colors, qty } lines.
      const grouped = Object.values(
        items.reduce((acc, i) => {
          const key = `${i.id}|${i.colors.join(',')}`
          if (!acc[key]) acc[key] = { id: i.id, colors: i.colors, qty: 0 }
          acc[key].qty += 1
          return acc
        }, {})
      )
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        // The advertising consent is stamped onto the Stripe session so the
        // webhook can honor it later. Browser state is gone by the time the
        // webhook runs, so this is the only way the server-side Meta event can
        // respect the same choice. Read at click time, not render time.
        // giftCode: a signup-gift code from the gift email's link, applied
        // server-side so the shopper doesn't type it (validated against Stripe).
        body: JSON.stringify({ items: grouped, adConsent: getConsent().advertising && !isInternal(), internal: isInternal(), giftCode: getGiftCode() || undefined, priceVariant: getPriceVariant() }),
      })
      const raw = await res.text()
      let data
      try {
        data = JSON.parse(raw)
      } catch {
        throw new Error(
          'The checkout API did not respond. Make sure the site is served via Cloudflare (e.g. `wrangler pages dev`), not plain Vite.'
        )
      }
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Could not start checkout.')
      }
      // A stored gift code the server would not apply (used, expired, unknown)
      // is forgotten, so the cart stops promising a discount that isn't coming.
      if (data.giftApplied === false && getGiftCode()) clearGiftCode()
      window.location.href = data.url
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return { start, loading, error }
}
