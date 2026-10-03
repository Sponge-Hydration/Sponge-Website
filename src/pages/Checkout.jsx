import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Seo } from '../components/useSEO'
import { usd } from '../components/bits'
import { useCart } from '../cart/CartContext'
import { CartIcon, CheckCircleIcon, LockIcon, ShieldIcon } from '../components/icons'
import { cartShipping } from '../pricing'
import { trackBeginCheckout, trackPurchase } from '../analytics'
import { useStripeCheckout } from '../cart/useStripeCheckout'
import CheckoutTerms from '../components/CheckoutTerms'
import { clearGiftCode } from '../gift'
import EmailSignup from '../components/EmailSignup'

export default function Checkout() {
  const { items, subtotal, clear } = useCart()
  const [searchParams] = useSearchParams()
  const { start, loading, error } = useStripeCheckout()

  const shipping = cartShipping(items) // A/B arm: free or flat $5 (src/pricing.js)
  // Sales tax is destination-based and computed by Stripe on the hosted page
  // from the address the customer enters, so we can't show an exact figure here.
  const total = subtotal + shipping

  const success = searchParams.get('status') === 'success'
  const sessionId = searchParams.get('session_id')

  // Clear the cart once we return from a successful Stripe Checkout — but read
  // the order value out of it first, since the cart is the only thing on this
  // page that knows what was bought. Stripe's session id is the dedupe key
  // against the server-side CAPI event in functions/api/webhook.js, so a
  // refresh of this page can't count the sale twice.
  useEffect(() => {
    if (success) {
      if (sessionId && total > 0) {
        trackPurchase({ sessionId, value: Number(total.toFixed(2)) })
      }
      clear()
      clearGiftCode() // single use: it has been spent
      window.scrollTo(0, 0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success])

  // Reaching this page with a populated cart is the begin_checkout signal.
  useEffect(() => {
    if (success || items.length === 0) return
    trackBeginCheckout(
      items.map((i) => ({ id: i.id, name: i.name, price: i.price, qty: 1 })),
      Number(total.toFixed(2))
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success, items.length])

  if (success) {
    return (
      <section className="section">
        <Seo title="Checkout | Sponge Hydration" description="Complete your Sponge pre-order." path="/checkout" noindex />
        <div className="container empty-state">
          <div className="empty-state__icon" aria-hidden="true"><CheckCircleIcon size={56} /></div>
          <h2>Order confirmed!</h2>
          <p>
            Thanks for ordering from Sponge Hydration. Your payment has been received, your card statement will show
            Sponge Hydration, and we’ve sent a confirmation to your email with a link to track
            your order.
          </p>
          <p style={{ marginTop: 4 }}>
            While you wait, download the free app and get your account ready:
          </p>
          <div className="app-badges" style={{ justifyContent: 'center' }}>
            <a href="https://apps.apple.com/us/app/sponge-hydration/id6566195232" target="_blank" rel="noopener noreferrer">
               Download on the App Store
            </a>
            <a href="https://play.google.com/store/apps/details?id=com.spongehydrationAndroid.sponge" target="_blank" rel="noopener noreferrer">
              ▶ Get it on Google Play
            </a>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 16 }}>
            <Link to="/products" className="btn btn--primary btn--lg">Continue shopping</Link>
            <Link to="/" className="btn btn--ghost btn--lg">Back to home</Link>
          </div>
        </div>
      </section>
    )
  }

  if (items.length === 0) {
    return (
      <section className="section">
        <Seo title="Checkout | Sponge Hydration" description="Complete your Sponge pre-order." path="/checkout" noindex />
        <div className="container empty-state">
          <div className="empty-state__icon" aria-hidden="true"><CartIcon size={56} /></div>
          <h2>Nothing to check out</h2>
          <p>Your cart is empty.</p>
          <Link to="/products" className="btn btn--primary btn--lg">Shop Sponge</Link>
        </div>
      </section>
    )
  }

  const payWithStripe = () => start()

  return (
    <section className="section">
      <Seo title="Checkout | Sponge Hydration" description="Complete your Sponge pre-order." path="/checkout" noindex />
      <div className="container">
        <h1 className="page-title">Checkout</h1>
        <div className="checkout-layout">
          <div className="checkout-form">
            <fieldset>
              <legend>Secure payment</legend>
              <p>
                You’ll be redirected to Stripe’s secure checkout to enter your contact, shipping
                (US only), and payment details. We never see or store your card information.
              </p>
              {error && <p style={{ color: 'crimson' }}>{error}</p>}
              <CheckoutTerms action="Continue to secure checkout" />
              <button
                type="button"
                className="btn btn--primary btn--lg btn--block"
                onClick={payWithStripe}
                disabled={loading}
              >
                {loading ? 'Redirecting…' : 'Continue to secure checkout'}
              </button>
              <p className="checkout-form__demo"><LockIcon size={14} /> Payments are processed securely by Stripe.</p>
              {/* Captured before the redirect so an abandoned checkout is
                  recoverable. Optional, and never blocks the purchase. */}
              <div className="checkout-form__signup">
                <EmailSignup
                  source="checkout"
                  label="Want batch updates by email? (optional)"
                  cta="Keep me posted"
                  placeholder="you@example.com"
                  variant="stacked"
                  done="Thanks, we’ll email you when your batch enters production."
                />
              </div>
            </fieldset>
          </div>

          <aside className="cart-summary">
            <h3>Order summary</h3>
            {items.map((i) => (
              <div className="cart-summary__line" key={i.uid}>
                <span>{i.name}</span>
                <span>{usd(i.lineTotal)}</span>
              </div>
            ))}
            <div className="cart-summary__row"><span>Shipping (USPS Ground)</span><span>{shipping === 0 ? 'Free' : usd(shipping)}</span></div>
            <div className="cart-summary__row"><span>Sales tax</span><span>Calculated at checkout</span></div>
            <div className="cart-summary__row cart-summary__total"><span>Total</span><span>{usd(total)} + tax</span></div>
            <p className="cart-summary__note"><ShieldIcon size={14} /> Pre-order · Cancel any time before it ships for a full refund · 30-day money-back guarantee from delivery</p>
          </aside>
        </div>
      </div>
    </section>
  )
}
