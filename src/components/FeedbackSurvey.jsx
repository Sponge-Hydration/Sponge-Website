import { useState } from 'react'
import { CheckCircleIcon } from './icons'

// The customer feedback survey. ONE form, two entry points:
//   /feedback  (variant="feedback") - the survey on its own, for owners
//   /reviews   (variant="review")   - the same form under the public review wall
//
// Both POST to /api/reviews, which writes a row into the Airtable "Feedback"
// base. Every field below maps to a column verified to exist there (see the
// FIELDS map in functions/api/reviews.js) - do NOT add a question without
// adding its column first: Airtable rejects the whole record with 422 when a
// field name is unknown, so one stray question silently loses every response.
export const RATING_CATEGORIES = [
  { key: 'device', label: 'The device' },
  { key: 'app', label: 'The app' },
  { key: 'setup', label: 'Setup' },
  { key: 'packaging', label: 'Packaging' },
]
export const RATING_WORDS = ['Great', 'Good', 'Okay', 'Poor']
// Options match the existing Airtable table exactly.
export const DISCOVERY_OPTIONS = ['Instagram', 'TikTok', 'Friend or family', 'Online search', 'Other']
export const USE_CASES = [
  'Fitness and training',
  'Daily habit building',
  'Focus and energy',
  'Preventive health',
  'App-lock feature',
  'Gift for someone',
]

// Interactive 1-5 star picker.
function StarPicker({ value, onChange, label }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="star-picker" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          type="button"
          key={n}
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          className={`star-picker__star${n <= (hover || value) ? ' is-on' : ''}`}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
        >
          ★
        </button>
      ))}
    </div>
  )
}

const COPY = {
  review: {
    overall: 'Overall rating *',
    open: 'Your review *',
    openPlaceholder: 'What do you love, and what could be better?',
    submit: 'Submit review',
    sending: 'Submitting…',
    sentTitle: 'Thank you!',
    sentBody: 'Your review was submitted. We read every one, thanks for helping make Sponge better.',
  },
  feedback: {
    overall: 'Overall, how is Sponge working for you? *',
    open: 'What should we fix, change or build next? *',
    openPlaceholder:
      'Anything: what annoys you, what you wish it did, what you would tell a friend to expect.',
    submit: 'Send my feedback',
    sending: 'Sending…',
    sentTitle: 'Got it — thank you.',
    sentBody:
      'Your answers went straight to the founders. We read every one, and this is genuinely how the next version gets decided.',
  },
}

export default function FeedbackSurvey({ variant = 'feedback' }) {
  const copy = COPY[variant] || COPY.feedback
  const [overall, setOverall] = useState(0)
  const [useCases, setUseCases] = useState([])
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState('')

  const toggleUseCase = (uc) =>
    setUseCases((prev) => (prev.includes(uc) ? prev.filter((x) => x !== uc) : [...prev, uc]))

  const submit = async (e) => {
    e.preventDefault()
    if (!overall) {
      setStatus('error')
      setErrorMsg('Please choose an overall star rating.')
      return
    }
    setStatus('sending')
    setErrorMsg('')
    const form = new FormData(e.target)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          overall,
          device: form.get('device') || '',
          app: form.get('app') || '',
          setup: form.get('setup') || '',
          packaging: form.get('packaging') || '',
          discovery: form.get('discovery') || '',
          useCases,
          feedback: form.get('feedback') || '',
          email: form.get('email') || '',
          nps: form.get('nps') || '',
          website: form.get('website') || '', // honeypot
        }),
      })
      let data = null
      try {
        data = await res.json()
      } catch {
        /* non-JSON (plain Vite dev server without functions) */
      }
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Could not send your feedback.')
      setStatus('sent')
      window.scrollTo(0, 0)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err.message || 'Could not send your feedback.')
    }
  }

  if (status === 'sent') {
    return (
      <div className="empty-state" style={{ padding: '40px 20px' }}>
        <div className="empty-state__icon" aria-hidden="true"><CheckCircleIcon size={56} /></div>
        <h2>{copy.sentTitle}</h2>
        <p>{copy.sentBody}</p>
      </div>
    )
  }

  return (
    <form className="checkout-form review-form" onSubmit={submit}>
      <div className="review-form__field">
        <label className="review-form__label">{copy.overall}</label>
        <StarPicker value={overall} onChange={setOverall} label={copy.overall} />
      </div>

      <div className="review-form__ratings">
        {RATING_CATEGORIES.map((c) => (
          <label key={c.key}>
            {c.label}
            <select name={c.key} defaultValue="">
              <option value="">Select</option>
              {RATING_WORDS.map((w) => (
                <option key={w}>{w}</option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <label>
        How did you hear about us?
        <select name="discovery" defaultValue="">
          <option value="">Choose one</option>
          {DISCOVERY_OPTIONS.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </label>

      <label>
        How likely are you to recommend Sponge to a friend? (0-10)
        <select name="nps" defaultValue="">
          <option value="">Prefer not to say</option>
          {Array.from({ length: 11 }, (_, n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </label>

      <div className="review-form__field">
        <span className="review-form__label">What do you use Sponge for?</span>
        <div className="review-form__chips">
          {USE_CASES.map((uc) => (
            <button
              type="button"
              key={uc}
              className={`chip${useCases.includes(uc) ? ' is-on' : ''}`}
              aria-pressed={useCases.includes(uc)}
              onClick={() => toggleUseCase(uc)}
            >
              {uc}
            </button>
          ))}
        </div>
      </div>

      <label>
        {copy.open}
        <textarea name="feedback" required rows={5} placeholder={copy.openPlaceholder} />
      </label>

      <label>
        Email <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(optional, only so we can follow up, never published)</span>
        <input name="email" type="email" placeholder="you@email.com" />
      </label>

      {/* Honeypot, hidden from real users, catches bots. */}
      <input name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }} />

      {status === 'error' && (
        <p role="alert" style={{ color: 'crimson' }}>{errorMsg}</p>
      )}

      <button type="submit" className="btn btn--primary btn--lg" disabled={status === 'sending'}>
        {status === 'sending' ? copy.sending : copy.submit}
      </button>
    </form>
  )
}
