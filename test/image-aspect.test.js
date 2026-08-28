// A-57. Regression guard for a real bug shipped in 62a5a02.
//
// Adding width/height attributes to <img> for layout stability had a side
// effect: browsers apply BOTH attributes as presentational hints. Any image
// whose CSS set only a width was then forced to its full pixel height and
// stretched — the Hydration Locks screenshot rendered 300x1066 instead of
// 300x533, exactly 2x too tall. A presentational height is also a *definite*
// height, so it silently overrode `aspect-ratio` on the hero as well.
//
// The fix is `height: auto` on the base img rule. These tests pin that, and pin
// that the class rules which legitimately set their own height still exist.

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(path.resolve(process.cwd(), 'src/index.css'), 'utf8')

/** The declaration block for a selector, found by plain string search. */
function ruleFor(selector) {
  const at = css.indexOf(selector + ' {')
  if (at === -1) return null
  const open = css.indexOf('{', at)
  const close = css.indexOf('}', open)
  return close === -1 ? null : css.slice(open, close + 1)
}

describe('base img rule', () => {
  // Matches the bare `img {` rule, not `.foo img {`.
  const base = ruleFor('\nimg')

  it('exists', () => {
    expect(base, 'a bare `img { ... }` rule must exist').not.toBeNull()
  })

  it('sets height: auto, so a presentational height hint cannot stretch images', () => {
    expect(base).toMatch(/height:\s*auto/)
  })

  it('still constrains images to their container', () => {
    expect(base).toMatch(/max-width:\s*100%/)
  })
})

describe('rules that intentionally set an image height still do', () => {
  // These use object-fit with a fixed box on purpose. Class specificity (0,1,0)
  // beats element (0,0,1), so the base rule cannot override them — this checks
  // the rules were not "fixed" away while chasing the stretch bug.
  it.each([
    ['.step__img', /height:\s*210px/],
    ['.persona__img', /height:\s*175px/],
    ['.lifestyle-band img', /height:\s*100%/],
  ])('%s keeps its explicit height', (selector, re) => {
    const rule = ruleFor(selector)
    expect(rule, selector + ' rule missing').not.toBeNull()
    expect(rule).toMatch(re)
  })
})

// The hero used to be an inset 9/16 phone frame guarded by `aspect-ratio`. It is
// now a full-bleed background layer, so the guard moves with it. This matters
// more than it did before: the reduced-motion still carries width="1920"
// height="1080" attributes but serves a 720x1200 portrait file below 940px, so
// the presentational hints disagree with the real file on every phone. Only
// because the rule pins BOTH dimensions and object-fit does that not stretch.
// The hero film plays in a panel rather than full-bleed. Full-bleed cover-cropped
// 25-40% off every frame depending on viewport and magnified what survived, which
// made the shots unreadable. The panel is sized by aspect-ratio, and that ratio
// must keep matching the encoded file — if the film is ever re-cut at different
// dimensions and this is not updated, the panel silently starts cropping again.
describe('the hero film panel shows the whole frame', () => {
  const rule = ruleFor('.hero__film')

  it('exists', () => {
    expect(rule, '.hero__film rule missing').not.toBeNull()
  })

  it('is sized by aspect-ratio, not a fixed height', () => {
    expect(rule).toMatch(/width:\s*100%/)
    expect(rule).toMatch(/height:\s*auto/)
    expect(rule).not.toMatch(/height:\s*\d/)
  })

  it('declares the same aspect as the encoded film, so nothing is cropped', () => {
    const m = rule.match(/aspect-ratio:\s*(\d+)\s*\/\s*(\d+)/)
    expect(m, 'aspect-ratio missing from .hero__film').not.toBeNull()
    // Kept in step with public asset src/media/hero-film.mp4 (1280x896).
    expect(Number(m[1]) / Number(m[2])).toBeCloseTo(1280 / 896, 4)
  })

  it('does not cover-crop, which is what full-bleed did', () => {
    expect(rule).not.toMatch(/object-fit:\s*cover/)
  })
})
