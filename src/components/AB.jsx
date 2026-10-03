/**
 * A price (or price wording) that differs between the A/B arms (src/pricing.js).
 * Both versions are in the page; CSS shows the visitor's arm, chosen by the
 * <head> script before first paint. Identical markup for every visitor, so
 * prerendering and hydration never disagree. The hidden half is display:none,
 * so screen readers skip it too.
 */
export default function AB({ a, b }) {
  return (
    <>
      <span className="ab-a">{a}</span>
      <span className="ab-b">{b}</span>
    </>
  )
}
