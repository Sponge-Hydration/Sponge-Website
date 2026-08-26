import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Seo, SITE } from '../components/useSEO'
import { SectionHead } from '../components/bits'
import SetupExplainer from '../components/SetupExplainer'
import { faqs } from '../data'

export default function HowItWorks() {
  const [open, setOpen] = useState(0)

  return (
    <>
      <Seo
        title={'Setup & FAQ | How the Sponge Hydration Tracker Works'}
        description="Set up your Sponge hydration tracker in two minutes: charge, pair the app, clip it on. Plus answers to common questions about battery, accuracy, bottles, and returns."
        path="/how-it-works"
        // FAQPage belongs here and nowhere else: this is the only page that
        // actually displays these questions, which is what Google requires.
        // Generated from the same `faqs` array the page renders, so the markup
        // cannot drift from the visible content.
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        }}
      />
      <section className="section">
        <div className="container">
          <SectionHead eyebrow="Setup" title="Up and running in two minutes" as="h1">
            No tools, no complicated pairing. Watch how Sponge goes from the box to tracking
            every sip, then explore each step yourself.
          </SectionHead>
          <SetupExplainer />
          <div className="setup-video">
            {/* No <track> yet — captions need a transcript of the actual audio,
                which has to come from the source video rather than be invented.
                Until then the title and the caption below carry the content. */}
            <video
              controls
              muted
              playsInline
              title="Setting up the Sponge app, your profile, and your Sponge ID"
              poster="/media/video/app-demo-poster.jpg"
              preload="none"
            >
              <source src="/media/video/app-demo.mp4" type="video/mp4" />
              Your browser cannot play this video. It shows the Sponge app being set up:
              creating a profile, then pairing a Sponge ID.
            </video>
            <p className="setup-video__cap">Watch: setting up the app, your profile, and your Sponge ID.</p>
          </div>
        </div>
      </section>

      <section className="section section--tint" id="faq">
        <div className="container">
          <SectionHead eyebrow="FAQ" title="Hydration tracker questions, answered">
            Everything you want to know before and after you order.
          </SectionHead>
          <div className="faq">
            {faqs.map((item, i) => (
              <div className={`faq__item${open === i ? ' open' : ''}`} key={item.q}>
                <button
                  className="faq__q"
                  aria-expanded={open === i}
                  aria-controls={`faq-a-${i}`}
                  id={`faq-q-${i}`}
                  onClick={() => setOpen(open === i ? -1 : i)}
                >
                  <span>{item.q}</span>
                  <span className="chev" aria-hidden="true">+</span>
                </button>
                <div className="faq__a" id={`faq-a-${i}`} role="region" aria-labelledby={`faq-q-${i}`}>
                  <p style={{ margin: 0 }}>{item.a}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 34 }}>
            <p style={{ color: 'var(--ink-soft)', marginBottom: 16 }}>Still have a question?</p>
            <Link to="/contact" className="btn btn--primary btn--lg">Contact support</Link>
          </div>
        </div>
      </section>
    </>
  )
}
