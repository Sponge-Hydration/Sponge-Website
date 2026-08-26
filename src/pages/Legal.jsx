import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Seo } from '../components/useSEO'
import { CONSENT_EVENT, clearTrackingCookies, getConsent, revokeConsent } from '../consent'
import { openPrivacyPreferences } from '../components/PrivacyControls'

const PAGES = {
  terms: {
    title: 'Terms of Service',
    updated: 'August 2026',
    body: [
      'These terms govern your use of the Sponge website and products. By placing an order you agree to them.',
      'Sponge is currently sold as a pre-order. Pre-orders are charged at the time of purchase, do not carry a committed delivery date, and may be cancelled by you for a full refund at any time before your device ships. Full terms are in our Pre-Order Policy.',
      'Sponge devices and the companion app are provided for general wellness and hydration tracking. They are not medical devices and should not be used to diagnose or treat any condition.',
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    updated: 'August 2026',
    body: [
      'This policy explains what Sponge Hydration LLC collects, why, who we hand it to, and what you can tell us to stop. It covers spongehydration.com and the Sponge mobile app. We have written it in plain English on purpose.',

      { h: 'The short version' },
      'We collect what we need to sell you a device, ship it, support it, and run the app. We do not sell your personal information for money. We do allow advertising companies to see some of your activity on this site — but only if you agree, and California law calls that "sharing". You can switch it off at the bottom of this page, from the "Do Not Sell or Share My Personal Information" link in our footer, or by turning on Global Privacy Control in your browser. We honour that signal automatically.',

      { h: 'What we collect, and where it comes from' },
      'Directly from you, when you give it to us:',
      { ul: [
        'Order details — name, email, shipping address, and what you bought. Your card details go straight to Stripe; we never see or store them.',
        'Contact form — your name, email, chosen topic, and message.',
        'Reviews — your rating, written feedback, what you use Sponge for, how you heard about us, an optional recommendation score, and an optional email address so we can follow up. Emails submitted with a review are never published.',
        'App account and hydration data — your account details and the sip and intake readings your device records.',
      ] },
      'Automatically, when you use the site:',
      { ul: [
        'Basic request data such as IP address and browser type, handled by Cloudflare as our host and security layer.',
        'Page-view measurement from Cloudflare Web Analytics. For each page load it records the page address, the referring address, the navigation type, and load-speed timings, together with a randomly generated identifier for that single page load and a token identifying this website. It sets no cookies, does not fingerprint your device, and does not link page loads together or follow you to other sites. We are being specific because this is measurement rather than strictly necessary infrastructure, and — unlike everything below — it currently runs before you make a choice. It is switched on at our hosting account rather than in the site itself, so the controls on this page cannot yet turn it off.',
        'If, and only if, you allow it: analytics and advertising identifiers stored as cookies in your browser by the companies named below. Nothing in that group loads before you choose, and declining means no request is made to them at all.',
      ] },

      { h: 'Why we use it' },
      { ul: [
        'To take payment, ship your order, and tell you where it is.',
        'To answer your emails and support requests.',
        'To run the app, show you your hydration history, and share it with the family members or caregivers you invite.',
        'To publish reviews you submit for publication.',
        'To keep the site up, secure, and free of fraud and abuse.',
        'With your permission only: to understand how the site is used, and to measure and target advertising.',
      ] },

      { h: 'Who we give it to' },
      'We use a small number of service providers, and only for the jobs listed here. We do not give your information to anyone else except where the law requires it, or if the business is sold — in which case this policy travels with it.',
      { ul: [
        'Stripe — payment processing and hosted checkout. Stripe collects your card and billing details directly and is responsible for them.',
        'Cloudflare — website hosting, content delivery, security, and the cookieless page-view measurement described above.',
        'Google — Gmail, to send your order confirmation and to deliver contact-form messages to our team; Google Sheets, where our order records are kept; and Google Fonts, which serves the site’s typefaces and therefore receives your IP address when a page loads.',
        'Airtable — where submitted product reviews are stored.',
        'Google Analytics — site usage measurement. Only if you allow analytics.',
        'Meta (Facebook and Instagram) and TikTok — advertising measurement and targeting, both in your browser and, after a completed order, from our own server. Only if you allow advertising.',
      ] },

      { h: 'Selling versus sharing' },
      'These two words mean specific things under California law, and they are not the same, so we will be precise rather than reassuring.',
      'We do not sell your personal information. We do not exchange it for money, and we have not done so in the past twelve months.',
      'We do share personal information for cross-context behavioural advertising, if you allow advertising cookies. In practice that means Meta and TikTok can see pages you viewed, items you added to your cart, and orders you completed on this site, and can connect that to your account with them so that advertising can be targeted and measured. Because that fits California’s definition of "sharing", we disclose it plainly here and give you a way to stop it.',
      'If you decline advertising, or your browser sends a Global Privacy Control signal, we do not load those companies’ code and we do not send them your order from our server either. We have not shared the personal information of anyone we know to be under 16.',

      { h: 'Cookies and tracking technologies' },
      'Essential storage always runs: your cart is kept in your own browser, and Cloudflare sets what it needs to serve and protect the site. None of it is used to advertise to you and none of it can be switched off without breaking the store. Cloudflare Web Analytics, described above, also runs on every page load without setting a cookie.',
      'Optional cookies are set by Google Analytics (analytics) and by Meta and TikTok (advertising). They only ever load after you choose to allow that category. Decline, and no request is made to those companies at all.',
      'You can change your mind at any time using the controls at the bottom of this page or the "Do Not Sell or Share My Personal Information" link in the footer of every page. Withdrawing consent clears the cookies we can reach and reloads the page so nothing keeps running.',

      { h: 'Global Privacy Control' },
      'If your browser or extension sends a Global Privacy Control signal, we treat it as a valid request to opt out of sharing for advertising. It applies automatically, on every visit, without you having to click anything. When it is on, advertising is switched off, the toggle for it is locked, and we tell you that is why. Turn the signal off in your browser if you want that choice back.',

      { h: 'How long we keep it' },
      { ul: [
        'Order records — kept while we are still responsible for the order and for as long as tax, accounting, and warranty obligations require.',
        'Contact messages — kept as long as needed to resolve your question and keep a record of support history.',
        'Reviews — kept until you ask us to remove yours.',
        'App account and hydration data — kept while your account is open, and deleted when you close it or ask us to.',
        'Analytics and advertising data — retained by Google, Meta, and TikTok under their own policies once shared. Ask us and we will tell you what we hold on our side.',
      ] },

      { h: 'How we protect it' },
      'The site is served over HTTPS. Payment card details never reach our servers. Access to order records and support mailboxes is limited to the people who need it. Our service providers are bound by their own agreements with us. No system is perfectly secure, and we will not claim otherwise — if a breach affects you, we will tell you as required by law.',

      { h: 'Your rights' },
      'If you are a California resident, you have the right to:',
      { ul: [
        'Know what personal information we have collected, where it came from, why we collected it, and who we disclosed it to.',
        'Access a copy of it.',
        'Correct anything that is wrong.',
        'Delete it, subject to the records we are legally required to keep.',
        'Opt out of sharing for cross-context behavioural advertising — the control is on this page and in the footer of every page.',
        'Not be discriminated against for exercising any of these rights. Our prices and service do not change because you opted out.',
      ] },
      'We do not use or disclose sensitive personal information for purposes that require a separate right to limit it.',
      'You do not have to have an account to make a request. Email team@spongehydration.com with the words "privacy request" and tell us what you want. We will confirm receipt within 10 business days and respond within 45 calendar days, extending once by a further 45 days if we need longer and telling you why. To protect you, we will ask you to confirm details we already hold before we act — for an order, that usually means the email address you ordered with. An authorised agent may act for you if you give them written permission and we can verify it.',
      'You can also exercise the advertising opt-out yourself, immediately and without contacting us, using the controls below.',

      { h: 'Children' },
      'Sponge is not directed at children under 13, and we do not knowingly collect personal information from them. We do not knowingly sell or share the personal information of anyone under 16. If you believe a child has given us information, email team@spongehydration.com and we will delete it.',

      { h: 'Changes to this policy' },
      'If we change how we handle your information, we will update this page and change the "last updated" date at the top. Material changes to advertising or sharing will also reset your saved privacy choices, so you get asked again rather than being carried over silently.',

      { h: 'How to contact us' },
      'Sponge Hydration LLC — email team@spongehydration.com and we will reply within one business day. If you need a postal address for a formal privacy request, ask and we will provide it.',
    ],
  },
  'pre-order': {
    title: 'Pre-Order Policy',
    updated: 'August 2026',
    body: [
      'Sponge is currently sold as a pre-order. We manufacture in production batches, and a batch is built once enough pre-orders are reserved to fill one. Because of that, we do not commit to a delivery date when you order. We would rather tell you that plainly than give you a date we cannot stand behind.',
      'Your card is charged when you place a pre-order. Pre-order payments are what fund the production run your device comes from. In exchange, the price you pay is locked — if our pricing changes before your batch ships, you still pay what you paid on the day you ordered.',
      'You may cancel a pre-order at any time before it ships, for any reason, and receive a full refund to your original payment method. Email team@spongehydration.com with your order number. Refunds are issued within 7 business days of your request.',
      'We will email you when your batch enters production, and again with tracking when your device ships. If we decide not to produce a batch you have reserved, we will cancel your order and refund you in full without you needing to ask.',
      'Hardware specifications, colour, finish, and packaging may change in minor ways between pre-order and production. If we make a change that materially reduces what the device does, we will tell you before it ships and you may cancel for a full refund.',
      'Once your Sponge is delivered, our 30-day money-back guarantee and 1-year limited warranty apply from the delivery date. See the Return Policy and Warranty Policy for those terms.',
    ],
  },
  returns: {
    title: 'Return Policy',
    updated: 'August 2026',
    body: [
      'Every Sponge comes with a 30-day money-back guarantee. If you’re not happy, contact us within 30 days of delivery for a full refund.',
      'To start a return, email team@spongehydration.com with your order number. We’ll send a prepaid label for items being returned within the U.S.',
      'Refunds are issued to your original payment method once the device is received and inspected.',
      'This guarantee applies from the date your device is delivered. If you have placed a pre-order that has not shipped yet, you are not waiting on this policy — you can cancel outright for a full refund at any time. See our Pre-Order Policy.',
    ],
  },
  warranty: {
    title: 'Warranty Policy',
    updated: 'June 2026',
    body: [
      'Sponge devices are covered by a 1-year limited warranty against manufacturing defects from the date of delivery.',
      'If your device stops working due to a defect, contact team@spongehydration.com and we’ll repair or replace it at no cost.',
      'The warranty does not cover damage from misuse, accidents, or unauthorized modification.',
    ],
  },
}

// A body entry is a plain string (paragraph), { h } (heading), or { ul } (list).
function Block({ block }) {
  if (typeof block === 'string') return <p>{block}</p>
  if (block.h) return <h2 style={{ fontSize: 21, marginTop: 32 }}>{block.h}</h2>
  if (block.ul) {
    return (
      <ul style={{ margin: '0 0 14px', paddingLeft: '1.15em', color: 'var(--ink-soft)' }}>
        {block.ul.map((item, i) => <li key={i} style={{ marginBottom: 6 }}>{item}</li>)}
      </ul>
    )
  }
  return null
}

// Live controls on the privacy page itself, so "change or withdraw your choice"
// is something the reader can actually do here rather than be told about.
function PrivacyChoicesPanel() {
  const [consent, setConsentState] = useState(null)

  useEffect(() => {
    setConsentState(getConsent())
    const onChange = () => setConsentState(getConsent())
    window.addEventListener(CONSENT_EVENT, onChange)
    return () => window.removeEventListener(CONSENT_EVENT, onChange)
  }, [])

  const summary = () => {
    if (!consent) return ''
    if (!consent.decided) return 'You have not made a choice yet, so nothing optional is running.'
    const on = [consent.analytics && 'analytics', consent.advertising && 'advertising'].filter(Boolean)
    return on.length
      ? `Currently allowed: ${on.join(' and ')}.`
      : 'You have declined all optional analytics and advertising.'
  }

  return (
    <div className="privacy-panel">
      <h2 style={{ fontSize: 21, marginTop: 0 }}>Your current choices</h2>
      <p>
        {summary()}
        {consent?.gpc && ' Your browser is sending a Global Privacy Control signal, so advertising sharing is switched off automatically and cannot be turned on here.'}
      </p>
      <div className="privacy-panel__actions">
        <button type="button" className="btn btn--primary" onClick={openPrivacyPreferences}>
          Manage privacy choices
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => { clearTrackingCookies(); revokeConsent(); window.location.reload() }}
        >
          Withdraw my consent
        </button>
      </div>
    </div>
  )
}

export default function Legal() {
  const { doc } = useParams()
  const page = PAGES[doc]

  if (!page) {
    return (
      <section className="section">
        <Seo title="Not found | Sponge" description="Page not found." path={`/legal/${doc || ''}`} noindex />
        <div className="container empty-state">
          <h2>Page not found</h2>
          <Link to="/" className="btn btn--primary">Back home</Link>
        </div>
      </section>
    )
  }

  return (
    <section className="section">
      <Seo title={`${page.title} | Sponge Hydration`} description={`${page.title} for Sponge Hydration.`} path={`/legal/${doc}`} />
      <div className="container prose">
        <h1 style={{ fontSize: 34, fontWeight: 800, marginBottom: 8 }}>{page.title}</h1>
        <p style={{ color: 'var(--muted)', marginBottom: 24 }}>Last updated {page.updated}</p>
        {page.body.map((block, i) => <Block key={i} block={block} />)}
        {doc === 'privacy' && <PrivacyChoicesPanel />}
        <p style={{ marginTop: 24 }}>
          Questions? <Link to="/contact" className="link-btn" style={{ display: 'inline' }}>Contact us</Link>.
        </p>
      </div>
    </section>
  )
}
