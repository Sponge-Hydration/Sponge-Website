import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Seo, SITE } from '../components/useSEO'
import { SectionHead } from '../components/bits'
import SetupExplainer from '../components/SetupExplainer'
import { faqs } from '../data'

// The finished tutorial parts, in order. Parts 1 and 2 are the versions Nathan
// graded 9/10 and approved for the site (Sep 18 and Sep 20 2026). Part 3 (app
// download and profile set-up) is waiting on screen recordings; when every part
// is done they get joined into one long tutorial and this list shrinks to one.
// Captions are the narration scripts, timed to each video's voice track.
const TUTORIALS = [
  {
    part: 1,
    title: 'Unboxing and what’s in the box',
    length: '1:07',
    src: '/media/video/tutorial-part1-unboxing-v3.mp4',
    poster: '/media/video/tutorial-part1-poster.jpg',
    captions: '/media/video/tutorial-part1-unboxing.en.vtt',
    fallback: 'It walks through the box: the QR code for the setup guide, your unit number, the Sponge, the snap ring, the magnetic adhesive, the USB-C cable and the quick setup guide.',
  },
  {
    part: 2,
    title: 'Attaching Sponge to your water bottle',
    length: '0:57',
    src: '/media/video/tutorial-part2-attaching-v1.mp4',
    poster: '/media/video/tutorial-part2-poster.jpg',
    captions: '/media/video/tutorial-part2-attaching.en.vtt',
    fallback: 'It shows cleaning the bottom of the bottle, centring and pressing on the magnetic adhesive, and snapping the Sponge on.',
  },
]

export default function HowItWorks() {
  const [open, setOpen] = useState(0)
  const { hash } = useLocation()

  // /how-it-works#faq-battery (and friends) opens that answer. The homepage
  // feature cards link here, so the answer has to be showing when they land.
  useEffect(() => {
    const m = hash.match(/^#faq-(.+)$/)
    if (!m) return
    const i = faqs.findIndex((item) => item.id === m[1])
    if (i < 0) return
    setOpen(i)
    // Opening this answer collapses the first one, which slides everything up
    // by its height over the 0.25s transition. Re-aim once that has settled, or
    // the question ends up hidden behind the sticky header.
    const t = setTimeout(() => {
      document.getElementById(`faq-${m[1]}`)?.scrollIntoView({ block: 'start' })
    }, 320)
    return () => clearTimeout(t)
  }, [hash])

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
        </div>
      </section>

      <section className="section" id="tutorials">
        <div className="container">
          <SectionHead eyebrow="Video tutorials" title="Setup, step by step">
            Short, narrated walkthroughs of each stage, with captions.
          </SectionHead>
          <div className="tutorials">
            {TUTORIALS.map((t) => (
              <figure className="tutorial" key={t.src}>
                <video controls playsInline preload="metadata" poster={t.poster} title={`Part ${t.part}: ${t.title}`}>
                  <source src={t.src} type="video/mp4" />
                  <track kind="captions" src={t.captions} srcLang="en" label="English" />
                  Your browser cannot play this video. {t.fallback}
                </video>
                <figcaption>
                  <span className="tutorial__part">Part {t.part}</span>
                  <span>{t.title}</span>
                  <span className="tutorial__len">{t.length}</span>
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="tutorials__next">
            <strong>Coming next:</strong> part three, downloading the app and setting up your
            profile. Once every part is finished we will join them into one full tutorial.
          </p>
        </div>
      </section>

      <section className="section section--tint" id="faq">
        <div className="container">
          <SectionHead eyebrow="FAQ" title="Hydration tracker questions, answered">
            Everything you want to know before and after you order.
          </SectionHead>
          <div className="faq">
            {faqs.map((item, i) => (
              <div className={`faq__item${open === i ? ' open' : ''}`} key={item.q} id={item.id ? `faq-${item.id}` : undefined}>
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
