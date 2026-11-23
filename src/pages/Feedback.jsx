import { Link } from 'react-router-dom'
import { Seo } from '../components/useSEO'
import { SectionHead } from '../components/bits'
import FeedbackSurvey from '../components/FeedbackSurvey'

// /feedback - the customer feedback survey on a page of its own.
//
// The same survey also sits at the bottom of /reviews, but that page leads with
// the public review wall, which frames it as "write us a testimonial". This one
// is framed as what it actually is: the founders asking owners what to build
// next. It is the link that goes in emails, the newsletter and the order-status
// page, so keep the path /feedback stable - printed and emailed links depend on
// it.
export default function Feedback() {
  return (
    <section className="section">
      <Seo
        title="Tell us what to build next | Sponge Feedback Survey"
        description="A short survey for Sponge owners: rate the device, the app, setup and packaging, and tell the founders what to fix or build next. Takes about two minutes."
        path="/feedback"
      />
      <div className="container">
        <SectionHead eyebrow="Feedback survey" title="Tell us what to build next" as="h1">
          About two minutes. Nathan and Chris read every response, and the V2 hardware
          and app roadmap are decided off the back of them.
        </SectionHead>

        <div className="review-form-wrap">
          <FeedbackSurvey variant="feedback" />
        </div>

        <p className="feedback-note">
          Your email is optional and is never published. Written feedback may be featured
          anonymously on our <Link to="/reviews">reviews page</Link> — nothing goes public
          until we approve it by hand, and we never publish your name or email. If you need
          help with an order or a device that is not working,{' '}
          <Link to="/support">customer support</Link> is faster than this form.
        </p>
      </div>
    </section>
  )
}
