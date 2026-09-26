// Shared by create-checkout-session.js and its tests. Underscore-prefixed so
// Cloudflare Pages does not route it.

// Stripe's required "I agree to the Terms of Service" checkbox. It only works
// while a terms URL is set in the Stripe Dashboard (Settings → Public details;
// Nathan set it on 2026-09-23) — without one, Stripe rejects the whole session.
// A rejection that names the terms or consent settings is recognised here so
// checkout can retry without the checkbox instead of failing for every buyer.
// The Terms version in force. Stamped on every Stripe session so each order
// records which Terms the buyer accepted. Bump it when the Terms change.
export const TERMS_VERSION = '2026-09-23'

export const termsCheckboxParams = (origin) => ({
  'consent_collection[terms_of_service]': 'required',
  'custom_text[terms_of_service_acceptance][message]':
    `I agree to Sponge Hydration’s [Terms of Service](${origin}/legal/terms), including binding individual arbitration and a class-action waiver (Section 17), and acknowledge its [Privacy Policy](${origin}/legal/privacy).`,
})

// Abandoned-cart recovery: Stripe's "email me offers" checkbox plus a
// recovery link (after_expiration) that reopens the same cart with the
// promotion-code field on. See functions/api/_recovery.js.
export const recoveryParams = () => ({
  'consent_collection[promotions]': 'auto',
  'after_expiration[recovery][enabled]': 'true',
  'after_expiration[recovery][allow_promotion_codes]': 'true',
})

// A rejection of the recovery/offers settings. Checked BEFORE the terms test,
// so a problem with the offers checkbox never costs us the terms checkbox.
export const isRecoverySetupError = (status, stripeError) => {
  if (status !== 400 || !stripeError) return false
  const param = String(stripeError.param || '')
  const message = String(stripeError.message || '')
  return param === 'consent_collection[promotions]' || param.startsWith('after_expiration') || /promotional|after_expiration|recovery/i.test(message)
}

export const isTermsSetupError = (status, stripeError) => {
  if (status !== 400 || !stripeError) return false
  const param = String(stripeError.param || '')
  if (param === 'consent_collection[promotions]') return false
  const message = String(stripeError.message || '')
  return param.startsWith('consent_collection') || param.startsWith('custom_text') || /terms of service|consent_collection/i.test(message)
}
