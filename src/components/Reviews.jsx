import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SectionHead } from './bits'
import { reviews as bakedReviews } from '../data'

// Star row for one real review, shows that review's actual rating.
export function ReviewStars({ value = 5 }) {
  const stars = Math.max(1, Math.min(5, Math.round(value)))
  return (
    // The empty state used to be a filled star in a near-white colour, so a 4
    // and a 5 were distinguishable only by hue — invisible to anyone who cannot
    // perceive it, and barely visible to anyone who can (WCAG 1.4.1). Outlined
    // glyphs carry the difference by shape, and the number states it outright.
    <span className="stars" aria-label={`${stars} out of 5 stars`}>
      <span aria-hidden="true">
        {'★'.repeat(stars)}
        <span className="stars__empty">{'☆'.repeat(5 - stars)}</span>
      </span>
      <span className="stars__value" aria-hidden="true">{stars.toFixed(1)}</span>
    </span>
  )
}

// One review card. The survey collected no names, so each card is attributed
// to a "Verified customer" with the use case they selected, honest, never an
// invented persona.
export function ReviewCard({ review }) {
  return (
    <article className="tcard">
      <ReviewStars value={review.stars} />
      <p>“{review.quote}”</p>
      <div className="tcard__who">
        <div className="tcard__av" aria-hidden="true">✓</div>
        <div>
          <strong>Verified customer</strong>
          {review.loc && <span>{review.loc}</span>}
        </div>
      </div>
    </article>
  )
}

// Homepage reviews section. Prerenders with the baked-in list from data.js,
// then refreshes from the Airtable-backed /api/reviews on the client so newly
// approved reviews appear without a redeploy. Only renders reviews that carry
// real written feedback, never placeholders or invented ones.
export default function Reviews() {
  const [reviews, setReviews] = useState(bakedReviews)

  useEffect(() => {
    let cancelled = false
    fetch('/api/reviews')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && Array.isArray(data?.reviews) && data.reviews.length > 0) {
          setReviews(data.reviews)
        }
      })
      .catch(() => {
        /* keep the baked-in list */
      })
    return () => {
      cancelled = true
    }
  }, [])

  const shown = reviews.filter((r) => r.quote && r.quote.trim())
  if (shown.length === 0) return null

  return (
    <section className="section section--tint" id="reviews">
      <div className="container">
        <SectionHead eyebrow="Reviews" title="What early customers are saying">
          Real, unedited feedback from the first Sponge owners.
        </SectionHead>
        <div className="tcards">
          {shown.map((review, i) => (
            <ReviewCard review={review} key={`${review.loc}-${i}`} />
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <Link to="/reviews" className="btn btn--ghost btn--lg">Read all reviews &amp; leave yours</Link>
        </div>
      </div>
    </section>
  )
}
