// Locks in the findings of the 2026-08-25 Cloudflare beacon review (A-33).
//
// Established empirically against production:
//  • The beacon is Cloudflare WEB ANALYTICS, not security infrastructure. Its
//    script tag carries data-cf-beacon with a Web Analytics siteToken, and it
//    POSTs page address, referrer, navigation type and load timings to
//    /cdn-cgi/rum.
//  • It is injected DOWNSTREAM of Pages Functions — a diagnostic build measured
//    `beaconVisibleToFunction: false` — so it cannot be stripped or consent-
//    gated from this repository. Disabling it is an account-level action.
//
// These tests guard the two things the repo CAN control: that we never ship our
// own copy of the beacon, and that the site never claims nothing runs before a
// decision (which would be untrue while Web Analytics is enabled).

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8')
// JSX wraps prose across source lines, so collapse whitespace before asserting
// on copy — otherwise these tests break on reformatting rather than on meaning.
const readText = (p) => read(p).replace(/\s+/g, ' ')

describe('we do not ship our own beacon', () => {
  it('no source file loads cloudflareinsights', () => {
    for (const f of [
      '../src/analytics.js',
      '../src/consent.js',
      '../src/components/Layout.jsx',
      '../src/components/PrivacyControls.jsx',
      '../index.html',
    ]) {
      expect(read(f)).not.toContain('cloudflareinsights')
    }
  })

  it('middleware records why it cannot be gated in code', () => {
    const mw = read('../functions/_middleware.js')
    expect(mw).toContain('beaconVisibleToFunction')
    expect(mw).toContain('account-level')
  })
})

describe('user-facing claims stay accurate while the beacon runs', () => {
  const banner = readText('../src/components/PrivacyControls.jsx')
  const policy = readText('../src/pages/Legal.jsx')

  it('the banner makes no absolute "nothing runs" claim', () => {
    expect(banner).not.toContain('We track nothing')
    expect(banner).not.toMatch(/nothing (loads|runs|is loaded) (at all )?until/i)
  })

  it('the essential section discloses the measurement rather than hiding it', () => {
    expect(banner).toContain('it is measurement')
    expect(banner).toContain('runs before you choose')
  })

  it('the policy names Cloudflare Web Analytics and what it records', () => {
    expect(policy).toContain('Cloudflare Web Analytics')
    expect(policy).toContain('the referring address')
    expect(policy).toContain('sets no cookies')
  })

  it('the policy states it runs before the choice and cannot be turned off here', () => {
    expect(policy).toContain('currently runs before you make a choice')
    expect(policy).toContain('cannot yet turn it off')
  })

  it('the "no request before consent" claim is scoped to the consent-gated vendors only', () => {
    // The strong claim must be attached to the named vendors, never to the site
    // as a whole, for as long as Web Analytics is enabled at the account level.
    expect(policy).toContain('Nothing in that group loads before you choose')
  })
})
