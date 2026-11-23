import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Seo } from '../components/useSEO'
import { SectionHead } from '../components/bits'
import { ReviewCard } from '../components/Reviews'
import FeedbackSurvey from '../components/FeedbackSurvey'
import { reviews as bakedReviews } from '../data'

// /reviews - the public review wall, with the same survey that /feedback uses
// underneath it. The form itself lives in components/FeedbackSurvey.jsx so the
// two pages cannot drift apart from the Airtable columns.
export default function ReviewsPage() {
  const [reviews, setReviews] = useState(bakedReviews.filter((r) => r.quote))

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

  return (
    <section className="section">
      <Seo
        title="Sponge Reviews | What Customers Say"
        description="Real reviews from Sponge hydration tracker owners, and a place to share your own experience."
        path="/reviews"
      />
      <div className="container">
        <SectionHead eyebrow="Reviews" title="What Sponge customers say" as="h1">
          Honest, unedited feedback from early Sponge owners, and your chance to add yours.
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
          <FeedbackSurvey variant="review" />
        </div>

        <p className="feedback-note">
          Rather tell us privately what to fix? The same questions, framed for owners, are
          on the <Link to="/feedback">feedback survey</Link>.
        </p>
      </div>
    </section>
  )
}
