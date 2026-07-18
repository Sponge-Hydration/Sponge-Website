// GET /api/order-status?token=…
//
// Verifies the signed token, reads the order's row from the sheet, enforces the
// 30-days-after-delivery expiry, and (optionally) merges live carrier tracking.

import { verifyStatusToken } from './_status-token.js'
import { getOrderRow } from './_sheets.js'
import { getTracking } from './_tracking.js'

const DELIVERED_TTL_DAYS = 30

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } })

export async function onRequestGet({ request, env }) {
  const token = new URL(request.url).searchParams.get('token')
  const orderNumber = await verifyStatusToken(token, env.STATUS_TOKEN_SECRET)
  if (!orderNumber) return json({ error: 'invalid' }, 401)

  let row
  try {
    row = await getOrderRow(env, orderNumber)
  } catch {
    return json({ error: 'lookup_failed' }, 502)
  }
  if (!row) return json({ error: 'not_found' }, 404)

  // Expiry: 30 days after the delivery date recorded in the sheet.
  const dd = row.deliveryDate ? new Date(row.deliveryDate) : null
  if (dd && !Number.isNaN(dd.getTime())) {
    const daysSince = (Date.now() - dd.getTime()) / 86400000
    if (daysSince > DELIVERED_TTL_DAYS) {
      return json({ expired: true, orderNumber: row.orderNumber })
    }
  }

  const tracking = getTracking(row.trackingNumber)
  return json({
    orderNumber: row.orderNumber,
    name: row.name || null,
    status: row.status || 'Processing',
    itemsSummary: row.itemsSummary || '',
    deliveryDate: row.deliveryDate || null,
    tracking,
  })
}
