import { useEffect, useState } from 'react'
import { Seo } from '../components/useSEO'
import { SectionHead } from '../components/bits'
import { ReviewCard } from '../components/Reviews'
import { CheckCircleIcon } from '../components/icons'
import { reviews as bakedReviews } from '../data'

const RATING_CATEGORIES = [
  { key: 'device', label: 'The device' },
  { key: 'app', label: 'The app' },
  { key: 'setup', label: 'Setup' },
  { key: 'packaging', label: 'Packaging' },
]
const RATING_WORDS = ['Great', 'Good', 'Okay', 'Poor']
const DISCOVERY_OPTIONS = ['Instagram', 'TikTok', 'Friend or referral', 'Online search', 'Other']
const USE_CASES = [
  'Fitness & training',
  'Daily habit building',
  'Preventive health',
  'Focus & energy',
  'Gift for someone',
  'Caregiving',
]

// Interactive 1–5 star picker.
function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="star-picker" role="radiogroup" aria-label="Overall rating">
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

export default function ReviewsPage() {
  const [reviews, setReviews] = useState(bakedReviews.filter((r) => r.quote))
  const [overall, setOverall] = useState(0)
  const [useCases, setUseCases] = useState([])
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let cancelled = false
    fetch('/api/reviews')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && Array.isArray(data?.reviews) && data.reviews.length > 0) {
          setReviews(data.reviews)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

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
          website: form.get('website') || '', // honeypot
        }),
      })
      let data = null
      try {
        data = await res.json()
      } catch {
        /* non-JSON (plain Vite dev server without functions) */
      }
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Could not submit your review.')
      setStatus('sent')
      window.scrollTo(0, 0)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err.message || 'Could not submit your review.')
    }
  }

  return (
    <section className="section">
      <Seo
        title="Sponge Reviews | What Customers Say"
        description="Real reviews from Sponge hydration tracker owners — and a place to share your own experience."
        path="/reviews"
      />
      <div className="container">
        <SectionHead eyebrow="Reviews" title="What Sponge customers say">
          Honest, unedited feedback from early Sponge owners — and your chance to add yours.
        </SectionHead>

        {reviews.length > 0 && (
          <div className="tcards" style={{ marginBottom: 48 }}>
            {reviews.map((r, i) => (
              <ReviewCard review={r} key={`${r.loc}-${i}`} />
            ))}
          </div>
        )}

        <div className="review-form-wrap">
          <h2 className="review-form__title">Leave a review</h2>
          {status === 'sent' ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <div className="empty-state__icon" aria-hidden="true"><CheckCircleIcon size={56} /></div>
              <h2>Thank you!</h2>
              <p>Your review was submitted. We read every one — thanks for helping make Sponge better.</p>
            </div>
          ) : (
            <form className="checkout-form review-form" onSubmit={submit}>
              <div className="review-form__field">
                <label className="review-form__label">Overall rating *</label>
                <StarPicker value={overall} onChange={setOverall} />
              </div>

              <div className="review-form__ratings">
                {RATING_CATEGORIES.map((c) => (
                  <label key={c.key}>
                    {c.label}
                    <select name={c.key} defaultValue="">
                      <option value="">—</option>
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
                Your review *
                <textarea name="feedback" required rows={5} placeholder="What do you love, and what could be better?" />
              </label>

              {/* Honeypot — hidden from real users, catches bots. */}
              <input name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }} />

              {status === 'error' && (
                <p role="alert" style={{ color: 'crimson' }}>{errorMsg}</p>
              )}

              <button type="submit" className="btn btn--primary btn--lg" disabled={status === 'sending'}>
                {status === 'sending' ? 'Submitting…' : 'Submit review'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
