// Privacy consent state.
//
// Three categories, only two of which the visitor controls:
//
//   essential   - always on, never toggleable. The cart in localStorage, the
//                 Stripe checkout redirect, Cloudflare's CDN/security layer and
//                 its cookieless Web Analytics beacon. Without these the store
//                 does not function, so they are not consent-gated.
//   analytics   - Google Analytics 4. Off until the visitor says otherwise.
//   advertising - Meta Pixel, TikTok Pixel, and the server-side Meta
//                 Conversions API. This is the category that constitutes
//                 "sharing" for cross-context behavioural advertising under the
//                 CPRA, so it is what the "Do Not Sell or Share" control and
//                 Global Privacy Control both act on.
//
// DEFAULT IS DENY. Nothing nonessential loads until there is a stored decision,
// so a first-time visitor generates no analytics or advertising request at all
// before choosing. That is stricter than California requires (which permits
// opt-out) and is the honest reading of "no request before the decision".
//
// GPC: navigator.globalPrivacyControl is a legally recognised opt-out signal in
// California. When present it forces `advertising` off and cannot be overridden
// from the UI — the preferences dialog disables that toggle and says why.

export const STORAGE_KEY = 'sponge-privacy-v1'
export const CONSENT_EVENT = 'sponge:consentchange'
const VERSION = 1

/** True when the browser is sending a Global Privacy Control opt-out signal. */
export function gpcEnabled() {
  if (typeof navigator === 'undefined') return false
  // Some browsers expose it on navigator, a few older extensions on window.
  return (
    navigator.globalPrivacyControl === true ||
    (typeof window !== 'undefined' && window.globalPrivacyControl === true)
  )
}

function readStored() {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || parsed.version !== VERSION) return null
    return {
      analytics: parsed.analytics === true,
      advertising: parsed.advertising === true,
      decidedAt: Number(parsed.decidedAt) || 0,
    }
  } catch {
    return null
  }
}

/**
 * Current effective consent.
 * `decided` is whether the visitor has made an explicit choice yet.
 * `advertising` already has GPC applied, so callers never need to re-check it.
 */
export function getConsent() {
  const gpc = gpcEnabled()
  const stored = readStored()
  if (!stored) {
    return { analytics: false, advertising: false, decided: false, gpc, decidedAt: 0 }
  }
  return {
    analytics: stored.analytics,
    // GPC wins over anything previously stored.
    advertising: gpc ? false : stored.advertising,
    decided: true,
    gpc,
    decidedAt: stored.decidedAt,
  }
}

function emit() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: getConsent() }))
}

/** Persist an explicit choice. Returns the resulting effective consent. */
export function setConsent({ analytics, advertising }) {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: VERSION,
          analytics: analytics === true,
          // Never persist an advertising grant while GPC is asserted.
          advertising: gpcEnabled() ? false : advertising === true,
          decidedAt: Date.now(),
        })
      )
    } catch {
      /* storage unavailable (private mode, blocked cookies) — deny by default */
    }
  }
  emit()
  return getConsent()
}

/**
 * Withdraw a previous decision entirely, returning the visitor to the
 * pre-decision state so the banner appears again and nothing is loaded.
 */
export function revokeConsent() {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }
  emit()
  return getConsent()
}

/**
 * Best-effort removal of cookies the ad/analytics tags set, used when consent
 * is downgraded. Scripts already executing cannot be unloaded, which is why the
 * UI also reloads the page after a downgrade — this just stops the identifiers
 * persisting into the next page view.
 */
export function clearTrackingCookies() {
  if (typeof document === 'undefined') return
  const names = ['_ga', '_gid', '_gat', '_fbp', '_fbc', '_ttp', '_tt_enable_cookie']
  const host = window.location.hostname
  // Cookies may be scoped to the exact host or to the registrable domain.
  const domains = [undefined, host, `.${host}`, `.${host.split('.').slice(-2).join('.')}`]
  document.cookie.split(';').forEach((c) => {
    const name = c.split('=')[0].trim()
    if (!name) return
    // _ga_<STREAMID> is per-property, so match the prefix too.
    const match = names.includes(name) || name.startsWith('_ga_') || name.startsWith('_tt')
    if (!match) return
    domains.forEach((d) => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${d ? `; domain=${d}` : ''}`
    })
  })
}
