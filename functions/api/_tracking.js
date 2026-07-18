// Carrier tracking (link-only, no paid API). Turns a tracking number into a
// deep link to the carrier's own tracking page. If you ever want live status /
// ETA / scan history in-page, this is where a tracking API would plug in.

export function carrierUrl(trackingNumber) {
  if (!trackingNumber) return null
  const t = String(trackingNumber).replace(/\s/g, '')
  if (/^1Z/i.test(t)) return `https://www.ups.com/track?tracknum=${t}`
  if (/^\d{15}$/.test(t)) return `https://www.fedex.com/fedextrack/?trknbr=${t}`
  // Default to USPS (matches the 94.. numbers used today).
  return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${t}`
}

export function getTracking(trackingNumber) {
  return {
    trackingNumber: trackingNumber || null,
    trackingUrl: carrierUrl(trackingNumber),
    status: null,
    estimatedDelivery: null,
    checkpoints: [],
  }
}
