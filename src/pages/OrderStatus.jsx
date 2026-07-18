import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Seo } from '../components/useSEO'

const humanize = (s) =>
  (s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

const fmtDate = (d) => {
  const t = d ? new Date(d) : null
  return t && !Number.isNaN(t.getTime())
    ? t.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null
}

export default function OrderStatus() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const [state, setState] = useState({ loading: true })

  useEffect(() => {
    if (!token) {
      setState({ loading: false, error: 'This order link is missing its code.' })
      return
    }
    fetch(`/api/order-status?token=${encodeURIComponent(token)}`)
      .then(async (r) => ({ ok: r.ok, status: r.status, data: await r.json().catch(() => ({})) }))
      .then(({ ok, status, data }) => {
        if (data.expired) setState({ loading: false, expired: true, data })
        else if (!ok)
          setState({
            loading: false,
            error:
              status === 404
                ? 'We couldn’t find that order.'
                : status === 401
                ? 'This order link is invalid.'
                : 'We couldn’t load your order right now. Please try again shortly.',
          })
        else setState({ loading: false, data })
      })
      .catch(() => setState({ loading: false, error: 'We couldn’t load your order right now.' }))
  }, [token])

  const shell = (children) => (
    <section className="section">
      <Seo title="Order Status | Sponge Hydration" description="Track your Sponge order." path="/order-status" noindex />
      <div className="container" style={{ maxWidth: 640 }}>
        {children}
      </div>
    </section>
  )

  if (state.loading) return shell(<p style={{ color: 'var(--muted)' }}>Loading your order…</p>)

  if (state.error)
    return shell(
      <div className="empty-state">
        <h2>Order status</h2>
        <p>{state.error}</p>
        <Link to="/" className="btn btn--primary btn--lg">Back to home</Link>
      </div>
    )

  if (state.expired)
    return shell(
      <div className="empty-state">
        <h2>This link has expired</h2>
        <p>
          Order tracking is available for 30 days after delivery. Need help with order{' '}
          <strong>{state.data.orderNumber}</strong>? Email us at{' '}
          <a href="mailto:support@spongehydration.com">support@spongehydration.com</a>.
        </p>
        <Link to="/" className="btn btn--primary btn--lg">Back to home</Link>
      </div>
    )

  const o = state.data
  const t = o.tracking || {}
  const liveStatus = t.status ? humanize(t.status) : null
  const eta = fmtDate(t.estimatedDelivery)
  const delivered = fmtDate(o.deliveryDate)

  return shell(
    <>
      <h1 className="page-title">Order {o.orderNumber}</h1>
      <p style={{ color: 'var(--muted)', marginTop: -8 }}>
        Status: <strong style={{ color: 'var(--ink)' }}>{liveStatus || humanize(o.status)}</strong>
      </p>

      {o.itemsSummary && (
        <div className="cart-summary" style={{ position: 'static', marginTop: 20 }}>
          <h3>What you ordered</h3>
          <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: 0 }}>{o.itemsSummary}</p>
        </div>
      )}

      <div className="cart-summary" style={{ position: 'static', marginTop: 20 }}>
        <h3>Shipping &amp; tracking</h3>
        {t.trackingNumber ? (
          <>
            <div className="cart-summary__row">
              <span>Tracking number</span>
              <span style={{ fontWeight: 700 }}>{t.trackingNumber}</span>
            </div>
            {eta && (
              <div className="cart-summary__row">
                <span>Estimated delivery</span>
                <span style={{ fontWeight: 700 }}>{eta}</span>
              </div>
            )}
            {delivered && (
              <div className="cart-summary__row">
                <span>Delivered</span>
                <span style={{ fontWeight: 700 }}>{delivered}</span>
              </div>
            )}
            {t.trackingUrl && (
              <a
                href={t.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--primary btn--lg btn--block"
                style={{ marginTop: 14 }}
              >
                Track package →
              </a>
            )}
            {t.checkpoints && t.checkpoints.length > 0 && (
              <div style={{ marginTop: 18 }}>
                <h3 style={{ fontSize: 15 }}>Tracking history</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {t.checkpoints.map((c, i) => (
                    <li key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--line)', fontSize: 14 }}>
                      <strong>{c.status}</strong>
                      <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                        {[fmtDate(c.date), c.location].filter(Boolean).join(' · ')}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: 0 }}>
            Your order is being prepared. We’ll add tracking here as soon as it ships — and email you too.
          </p>
        )}
      </div>

      <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 20 }}>
        Questions? Email <a href="mailto:support@spongehydration.com">support@spongehydration.com</a>.
      </p>
    </>
  )
}
