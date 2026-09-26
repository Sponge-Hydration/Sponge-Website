// Internal-traffic switch: keeps the team's own browsing out of GA4, Clarity
// and the ad pixels, so it doesn't skew the funnel and behaviour data.
//
//   https://www.spongehydration.com/?internal=1   -> this browser stops tracking
//   https://www.spongehydration.com/?internal=0   -> tracking back to normal
//
// The flag lives in localStorage, so it is per browser/device and survives
// until cleared. While it is set, analytics.js treats every consent category as
// denied: nothing is injected, nothing fires, and checkout sends no ad consent.
//
// SSG-safe: nothing touches window/localStorage at module scope.

export const INTERNAL_KEY = 'sponge-internal-v1'

function syncFromUrl() {
  if (typeof window === 'undefined') return
  let param
  try {
    param = new URLSearchParams(window.location.search).get('internal')
  } catch {
    return
  }
  if (param !== '1' && param !== '0') return
  try {
    if (param === '1') {
      if (localStorage.getItem(INTERNAL_KEY) !== '1') {
        localStorage.setItem(INTERNAL_KEY, '1')
        console.info('[Sponge] Internal mode ON: this browser is excluded from analytics. Visit ?internal=0 to undo.')
      }
    } else if (localStorage.getItem(INTERNAL_KEY) !== null) {
      localStorage.removeItem(INTERNAL_KEY)
      console.info('[Sponge] Internal mode OFF: analytics follows your cookie choice again.')
    }
  } catch {
    /* storage blocked: nothing to persist */
  }
}

/** True when this browser has been marked as internal (team) traffic. */
export function isInternal() {
  if (typeof window === 'undefined') return false
  syncFromUrl()
  try {
    return localStorage.getItem(INTERNAL_KEY) === '1'
  } catch {
    return false
  }
}
