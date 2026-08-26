import { useId, useState } from 'react'

/**
 * Email capture, used in the footer, on sold-out products, and before the
 * Stripe redirect. Reports failures honestly rather than showing a success
 * state it cannot back up — a signup form that quietly drops addresses is worse
 * than no form at all.
 *
 * Props:
 *   source   - where the signup came from, for list segmentation. Must be one
 *              of the values functions/api/subscribe.js allows.
 *   label    - visible label text
 *   cta      - submit button text
 *   done     - confirmation message
 *   variant  - 'inline' (default) or 'stacked' for narrow columns
 */
export default function EmailSignup({
  source,
  label = 'Email address',
  cta = 'Sign up',
  done = 'Thanks — you’re on the list.',
  placeholder = 'you@example.com',
  variant = 'inline',
}) {
  const id = useId()
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [state, setState] = useState('idle') // idle | sending | ok | error
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (state === 'sending') return
    setState('sending')
    setError('')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, source, website }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Something went wrong.')
      setState('ok')
      setEmail('')
    } catch (err) {
      setState('error')
      setError(err.message || 'Something went wrong.')
    }
  }

  if (state === 'ok') {
    return (
      <p className="signup__done" role="status">
        {done}
      </p>
    )
  }

  return (
    <form className={`signup signup--${variant}`} onSubmit={submit} noValidate>
      <label className="signup__label" htmlFor={id}>{label}</label>
      <div className="signup__row">
        <input
          id={id}
          type="email"
          className="signup__input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder}
          autoComplete="email"
          required
          aria-describedby={error ? `${id}-err` : undefined}
          aria-invalid={state === 'error' || undefined}
        />
        <button type="submit" className="btn btn--primary signup__btn" disabled={state === 'sending'}>
          {state === 'sending' ? 'Sending…' : cta}
        </button>
      </div>
      {/* Honeypot — hidden from people, irresistible to bots. */}
      <div className="signup__hp" aria-hidden="true">
        <label htmlFor={`${id}-website`}>Website</label>
        <input
          id={`${id}-website`}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>
      {error && (
        <p className="signup__err" id={`${id}-err`} role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
