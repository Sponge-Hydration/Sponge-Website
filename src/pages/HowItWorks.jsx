import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSEO } from '../components/useSEO'
import { SectionHead } from '../components/bits'
import { faqs } from '../data'

export default function HowItWorks() {
  useSEO({
    title: 'Setup & FAQ | How the Sponge Hydration Tracker Works',
    description:
      'Set up your Sponge hydration tracker in two minutes: charge, pair the app, clip it on. Plus answers to common questions about battery, accuracy, bottles, and returns.',
    path: '/how-it-works',
  })
  const [open, setOpen] = useState(0)

  return (
    <>
      <section className="section">
        <div className="container">
          <SectionHead eyebrow="Setup" title="Up and running in two minutes">
            No tools, no complicated pairing. Three steps and you’re tracking.
          </SectionHead>
          <div className="steps">
            <div className="step"><div className="step__n">1</div><h3>Charge it</h3><p>Top up your Sponge over USB-C. A full charge lasts about 8 days.</p></div>
            <div className="step"><div className="step__n">2</div><h3>Pair the app</h3><p>Download the free Sponge app, open it, and connect over Bluetooth. The app calibrates your bottle size.</p></div>
            <div className="step"><div className="step__n">3</div><h3>Clip &amp; go</h3><p>Snap Sponge magnetically onto your bottle. Every sip from now on is tracked automatically.</p></div>
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
                <button className="faq__q" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}>
                  <span>{item.q}</span>
                  <span className="chev" aria-hidden="true">+</span>
                </button>
                <div className="faq__a"><p style={{ margin: 0 }}>{item.a}</p></div>
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
