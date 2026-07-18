// Carrier tracking. Pluggable: with EASYPOST_API_KEY set, returns live status +
// estimated delivery + recent checkpoints. Without it, returns just a link to
// the carrier's own tracking page (so the status page still works, for free).

export function carrierUrl(trackingNumber) {
  if (!trackingNumber) return null
  const t = String(trackingNumber).replace(/\s/g, '')
  if (/^1Z/i.test(t)) return `https://www.ups.com/track?tracknum=${t}`
  if (/^\d{15}$/.test(t)) return `https://www.fedex.com/fedextrack/?trknbr=${t}`
  // Default to USPS (matches the 94.. numbers used today).
  return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${t}`
}

export async function getTracking(env, trackingNumber, carrier = 'USPS') {
  const base = {
    trackingNumber: trackingNumber || null,
    trackingUrl: carrierUrl(trackingNumber),
    status: null,
    estimatedDelivery: null,
    checkpoints: [],
  }
  if (!trackingNumber || !env.EASYPOST_API_KEY) return base

  try {
    const auth = 'Basic ' + btoa(`${env.EASYPOST_API_KEY}:`)
    const res = await fetch('https://api.easypost.com/v2/trackers', {
      method: 'POST',
      headers: { Authorization: auth, 'content-type': 'application/json' },
      body: JSON.stringify({ tracker: { tracking_code: trackingNumber, carrier } }),
    })
    if (!res.ok) return base
    const t = await res.json()
    return {
      ...base,
      status: t.status || null, // pre_transit | in_transit | out_for_delivery | delivered | ...
      estimatedDelivery: t.est_delivery_date || null,
      checkpoints: (t.tracking_details || [])
        .slice(-6)
        .reverse()
        .map((d) => ({
          status: d.message || d.status,
          date: d.datetime,
          location: [d.tracking_location?.city, d.tracking_location?.state].filter(Boolean).join(', '),
        })),
    }
  } catch {
    return base
  }
}
