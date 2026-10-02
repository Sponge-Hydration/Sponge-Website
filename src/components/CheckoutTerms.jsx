import { Link } from 'react-router-dom'

/**
 * The agreement notice shown directly above any button that starts checkout.
 * One component so the wording cannot drift between the cart and /checkout.
 * `action` is the label of the button it sits above.
 * `compact` is the one-line form.
 */
export default function CheckoutTerms({ action, refundLine = true, compact = false }) {
  // Short form for tight spots (the mobile button above the cart). Same links,
  // still names arbitration and the class-action waiver.
  if (compact) {
    return (
      <p className="checkout-form__terms">
        By selecting “{action}”, you agree to our{' '}
        <Link to="/legal/terms" target="_blank" rel="noopener">Terms</Link> (arbitration and
        class-action waiver, Section 17) and{' '}
        <Link to="/legal/privacy" target="_blank" rel="noopener">Privacy Policy</Link>.
      </p>
    )
  }
  return (
    <p className="checkout-form__terms">
      By selecting “{action}”, you agree to our{' '}
      <Link to="/legal/terms" target="_blank" rel="noopener">Terms of Service</Link>, including
      binding individual arbitration and a class-action waiver (Section 17), and acknowledge
      our <Link to="/legal/privacy" target="_blank" rel="noopener">Privacy Policy</Link>.
      {refundLine && ' Pre-orders can be canceled for a full refund any time before they ship.'}
    </p>
  )
}
