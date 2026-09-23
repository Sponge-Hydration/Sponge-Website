// The Terms of Service only protect the company if (1) the protective clauses are
// actually in them, (2) they are shown to the buyer before the purchase button,
// and (3) they do not contradict the consumer promises made elsewhere on the site
// — a contradiction there invites a deceptive-practices claim instead of
// preventing one. These checks fail if any of the three quietly breaks.

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const src = (p) => readFileSync(path.resolve(process.cwd(), p), 'utf8')
const legal = src('src/pages/Legal.jsx')
const terms = legal.slice(legal.indexOf('  terms: {'), legal.indexOf('  privacy: {'))

describe('the Terms of Service', () => {
  it.each([
    ['an arbitration agreement', /binding arbitration on an individual basis/],
    ['a class-action and jury waiver', /CLASS-ACTION AND JURY WAIVER/],
    ['a 30-day arbitration opt-out', /within 30 days after you first accept these Terms/],
    ['a liability cap', /LIMITED TO THE GREATER OF/],
    ['a warranty disclaimer', /“AS IS” AND “AS AVAILABLE”/],
    ['a not-medical-advice clause', /not medical devices/],
    ['an App Lock risk clause', /Do not lock any app you might need/],
    ['an indemnity', /defend, indemnify and hold harmless/],
    ['the California 1789.3 notice', /Civil Code Section 1789\.3/],
    ['California law and Orange County courts', /Orange County, California/],
  ])('contains %s', (_, re) => {
    expect(terms).toMatch(re)
  })

  it('keeps the promises made in the other policies', () => {
    expect(terms).toMatch(/30-day money-back guarantee/)
    expect(terms).toMatch(/1-year limited warranty/)
    expect(terms).toMatch(/cancelled by you for a full refund at any time before your order ships/)
    expect(terms).toMatch(/that policy controls for that subject/)
  })
})

describe('where the Terms are presented', () => {
  it('shows them right above the button that starts checkout', () => {
    const checkout = src('src/pages/Checkout.jsx')
    const notice = checkout.indexOf('to="/legal/terms"')
    const button = checkout.indexOf('onClick={payWithStripe}')
    expect(notice).toBeGreaterThan(0)
    expect(button).toBeGreaterThan(notice)
    expect(checkout.slice(notice, button)).toMatch(/arbitration/)
  })

  it('links them from the Support column of the footer', () => {
    const footer = src('src/components/Footer.jsx')
    const support = footer.slice(footer.indexOf('<h4>Support</h4>'), footer.indexOf('</div>', footer.indexOf('<h4>Support</h4>')))
    expect(support).toMatch(/to="\/legal\/terms">Terms of Service</)
  })
})
