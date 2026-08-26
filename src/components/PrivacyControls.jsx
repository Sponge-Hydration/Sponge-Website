import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CONSENT_EVENT, clearTrackingCookies, getConsent, setConsent } from '../consent'

// Any component can open the preferences dialog by dispatching this event —
// used by the persistent "Do Not Sell or Share" link in the footer. Avoids
// threading state through the whole tree for a control used once.
export const OPEN_PRIVACY_EVENT = 'sponge:openprivacy'

export function openPrivacyPreferences() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(OPEN_PRIVACY_EVENT))
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function PrivacyControls() {
  // `null` until mounted on the client — prevents any prerender/hydration
  // mismatch, since consent lives in localStorage which does not exist in Node.
  const [consent, setConsentState] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [draft, setDraft] = useState({ analytics: false, advertising: false })

  const dialogRef = useRef(null)
  const restoreFocusRef = useRef(null)

  useEffect(() => {
    setConsentState(getConsent())
    const onChange = () => setConsentState(getConsent())
    const onOpen = () => {
      // Re-read rather than trusting the mount-time snapshot: an extension can
      // start asserting GPC at any point during the session, and the dialog is
      // where that has to be visible and enforced.
      const c = getConsent()
      setConsentState(c)
      setDraft({ analytics: c.analytics, advertising: c.advertising })
      restoreFocusRef.current = document.activeElement
      setDialogOpen(true)
    }
    window.addEventListener(CONSENT_EVENT, onChange)
    window.addEventListener(OPEN_PRIVACY_EVENT, onOpen)
    return () => {
      window.removeEventListener(CONSENT_EVENT, onChange)
      window.removeEventListener(OPEN_PRIVACY_EVENT, onOpen)
    }
  }, [])

  // Saving a choice that removes a previously granted category cannot unload
  // scripts that already ran, so we clear their cookies and reload. Reloading
  // is the only way to guarantee a tag is really gone.
  const commit = useCallback(
    (next) => {
      const before = getConsent()
      const after = setConsent(next)
      setConsentState(after)
      setDialogOpen(false)
      const downgraded =
        (before.analytics && !after.analytics) || (before.advertising && !after.advertising)
      if (downgraded) {
        clearTrackingCookies()
        window.location.reload()
      }
    },
    []
  )

  const closeDialog = useCallback(() => {
    setDialogOpen(false)
    if (restoreFocusRef.current?.focus) restoreFocusRef.current.focus()
  }, [])

  // Focus trap + Escape, active only while the dialog is open.
  useEffect(() => {
    if (!dialogOpen) return
    const node = dialogRef.current
    const first = node?.querySelector(FOCUSABLE)
    first?.focus()

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        closeDialog()
        return
      }
      if (e.key !== 'Tab' || !node) return
      const items = [...node.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null)
      if (items.length === 0) return
      const firstEl = items[0]
      const lastEl = items[items.length - 1]
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [dialogOpen, closeDialog])

  if (consent === null) return null

  const showBanner = !consent.decided && !dialogOpen

  return (
    <>
      {showBanner && (
        <div className="privacy-banner" role="region" aria-label="Privacy choices">
          <div className="privacy-banner__inner">
            <div className="privacy-banner__text">
              <strong>You decide what we measure.</strong>
              <p>
                Analytics and advertising cookies load only if you allow them. Declining changes
                nothing about how the site works. <Link to="/legal/privacy">Privacy policy</Link>.
              </p>
              {consent.gpc && (
                <p className="privacy-banner__gpc">
                  Global Privacy Control detected — advertising sharing is already off.
                </p>
              )}
            </div>
            <div className="privacy-banner__actions">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => commit({ analytics: false, advertising: false })}
              >
                Decline all
              </button>
              <button type="button" className="btn btn--ghost" onClick={openPrivacyPreferences}>
                Choose
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => commit({ analytics: true, advertising: true })}
              >
                Accept all
              </button>
            </div>
          </div>
        </div>
      )}

      {dialogOpen && (
        <div className="privacy-modal" onMouseDown={(e) => e.target === e.currentTarget && closeDialog()}>
          <div
            className="privacy-modal__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="privacy-modal-title"
            ref={dialogRef}
          >
            <h2 id="privacy-modal-title">Your privacy choices</h2>
            <p className="privacy-modal__lede">
              Turn these off at any time. Nothing here affects your ability to browse, order,
              or get support.
            </p>

            <ul className="privacy-opts">
              <li>
                <div className="privacy-opt__head">
                  <span className="privacy-opt__name">Essential</span>
                  <span className="privacy-opt__always">Always on</span>
                </div>
                <p>
                  Your cart, the Stripe checkout, and Cloudflare&rsquo;s security and delivery
                  layer. The site cannot function without these.
                </p>
                <p>
                  Our host also counts page views and load times at the network level. It sets no
                  cookies and does not identify you or follow you to other sites, but it is
                  measurement, so we will not pretend otherwise: it runs before you choose here
                  and this dialog cannot currently switch it off.{' '}
                  <Link to="/legal/privacy">What it records</Link>.
                </p>
              </li>

              <li>
                <div className="privacy-opt__head">
                  <label className="privacy-opt__name" htmlFor="opt-analytics">Analytics</label>
                  <input
                    id="opt-analytics"
                    type="checkbox"
                    className="privacy-opt__toggle"
                    checked={draft.analytics}
                    onChange={(e) => setDraft((d) => ({ ...d, analytics: e.target.checked }))}
                  />
                </div>
                <p>
                  Google Analytics, so we can see which pages people actually use. Sets cookies
                  in your browser.
                </p>
              </li>

              <li>
                <div className="privacy-opt__head">
                  <label className="privacy-opt__name" htmlFor="opt-advertising">
                    Advertising &amp; sharing
                  </label>
                  <input
                    id="opt-advertising"
                    type="checkbox"
                    className="privacy-opt__toggle"
                    checked={draft.advertising && !consent.gpc}
                    disabled={consent.gpc}
                    aria-describedby={consent.gpc ? 'opt-advertising-gpc' : undefined}
                    onChange={(e) => setDraft((d) => ({ ...d, advertising: e.target.checked }))}
                  />
                </div>
                <p>
                  Meta (Facebook and Instagram) and TikTok advertising tools, in the browser and
                  from our server after an order. This one involves <strong>sharing</strong> your
                  information with those companies for cross-context behavioural advertising, in
                  the sense California law uses the word. Switching it off is the same as telling
                  us &ldquo;Do Not Sell or Share My Personal Information&rdquo;.
                </p>
                {consent.gpc && (
                  <p className="privacy-opt__gpc" id="opt-advertising-gpc">
                    Locked off because your browser is sending a Global Privacy Control signal.
                    We honour that automatically — turn the signal off in your browser or
                    extension if you want this choice back.
                  </p>
                )}
              </li>
            </ul>

            <div className="privacy-modal__actions">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => commit({ analytics: false, advertising: false })}
              >
                Decline all
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => commit(draft)}
              >
                Save preferences
              </button>
            </div>

            <button type="button" className="privacy-modal__close" onClick={closeDialog} aria-label="Close">
              &times;
            </button>
          </div>
        </div>
      )}
    </>
  )
}
