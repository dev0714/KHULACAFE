'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { getDriverOrders, updateOrderStatus, getMyStaffRole } from '../admin/actions'

const GOLD = '#f5c842'

const STAGES = [
  { key: 'received',         label: 'Received',            color: '#6b9fff' },
  { key: 'making',           label: 'Being made',          color: '#f5c842' },
  { key: 'ready',            label: 'Ready for collection', color: '#26de81' },
  { key: 'out_for_delivery', label: 'Out for delivery',    color: '#ff9f43' },
  { key: 'delivered',        label: 'Delivered',           color: '#26de81' },
]
const meta = (k) => STAGES.find(s => s.key === k) ?? STAGES[0]
const ref = (o) => `#${o.id.slice(0, 8).toUpperCase()}`

function timeAgo(iso) {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  return `${Math.round(m / 60)} h ago`
}

export default function DriverPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(null)
  const [who, setWho] = useState(null)
  const [toast, setToast] = useState(null)
  const knownReady = useRef(null)

  const load = useCallback(async () => {
    try {
      const data = await getDriverOrders()
      setOrders(data)
    } catch { /* signed out — middleware will redirect */ }
    setLoading(false)
  }, [])

  useEffect(() => { load(); getMyStaffRole().then(setWho).catch(() => {}) }, [load])

  // Poll so a driver standing in the shop sees new work without refreshing.
  useEffect(() => {
    const t = setInterval(async () => {
      let data = []
      try { data = await getDriverOrders() } catch { return }
      setOrders(data)

      const readyIds = new Set(data.filter(o => o.status === 'ready').map(o => o.id))
      if (knownReady.current === null) { knownReady.current = readyIds; return }
      const fresh = [...readyIds].filter(id => !knownReady.current.has(id))
      if (fresh.length > 0) {
        const o = data.find(x => x.id === fresh[0])
        setToast(`${ref(o)} is ready for collection`)
        setTimeout(() => setToast(null), 8000)
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('Ready for collection', { body: `${ref(o)} — ${o.customer_name}`, icon: '/images/logo.png' })
        }
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([200, 100, 200])
      }
      knownReady.current = readyIds
    }, 15000)
    return () => clearInterval(t)
  }, [])

  async function advance(order, status) {
    setBusy(order.id)
    try { await updateOrderStatus(order.id, status); await load() }
    finally { setBusy(null) }
  }

  function enableAlerts() {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') Notification.requestPermission()
  }

  const readyNow = orders.filter(o => o.status === 'ready')
  const mine = orders.filter(o => o.status === 'out_for_delivery')
  const coming = orders.filter(o => o.status === 'received' || o.status === 'making')

  return (
    <div style={{ background: '#0a0600', minHeight: '100vh', padding: '24px 0 60px' }}>
      {toast && (
        <div style={{
          position: 'fixed', top: '16px', left: '16px', right: '16px', zIndex: 9999,
          background: '#1e1500', border: `1px solid ${GOLD}`, borderRadius: '14px',
          padding: '16px 18px', color: '#fafafa', fontSize: '15px', fontWeight: 700,
          boxShadow: '0 8px 32px rgba(245,200,66,0.35)',
        }}>🛵 {toast}</div>
      )}

      <div className="section-wrap" style={{ maxWidth: '680px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
          <h1 style={{ fontFamily: 'var(--font-playfair)', color: '#fafafa', fontSize: '30px', margin: 0 }}>Deliveries</h1>
          <button onClick={enableAlerts} style={{
            flexShrink: 0, background: 'transparent', border: '1px solid #2e2000', color: GOLD,
            borderRadius: '20px', padding: '8px 14px', fontSize: '11px', fontWeight: 700,
            letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer',
          }}>Enable alerts</button>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '28px' }}>
          {who?.name ? `Signed in as ${who.name}. ` : ''}This list refreshes by itself.
        </p>

        {loading && <p style={{ color: 'rgba(255,255,255,0.4)' }}>Loading…</p>}

        {!loading && orders.length === 0 && (
          <div style={{ background: '#1e1500', border: '1px solid #2e2000', borderRadius: '14px', padding: '32px', textAlign: 'center' }}>
            <p style={{ color: 'rgba(255,255,255,0.45)', margin: 0 }}>No deliveries right now. You are all caught up.</p>
          </div>
        )}

        <Group title="Ready for collection" hint="Collect these now" orders={readyNow} advance={advance} busy={busy} action={{ key: 'out_for_delivery', label: 'I have collected it' }} />
        <Group title="Out for delivery" hint="Mark delivered before you leave the customer" orders={mine} advance={advance} busy={busy} action={{ key: 'delivered', label: 'Delivered to customer' }} />
        <Group title="Still in the kitchen" hint="Not ready yet" orders={coming} advance={advance} busy={busy} action={null} />

        <Link href="/" style={{ display: 'block', textAlign: 'center', marginTop: '32px', color: 'rgba(255,255,255,0.3)', fontSize: '12px', textDecoration: 'none' }}>
          ← Back to site
        </Link>
      </div>
    </div>
  )
}

function Group({ title, hint, orders, advance, busy, action }) {
  if (orders.length === 0) return null
  return (
    <section style={{ marginBottom: '32px' }}>
      <p style={{ fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: GOLD, margin: '0 0 4px' }}>{title} · {orders.length}</p>
      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', margin: '0 0 14px' }}>{hint}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {orders.map(o => {
          const st = meta(o.status)
          return (
            <div key={o.id} style={{ background: '#1e1500', border: `1px solid ${o.status === 'ready' ? GOLD : '#2e2000'}`, borderRadius: '14px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: '0 0 2px', color: GOLD, fontSize: '13px', fontWeight: 700 }}>{ref(o)}</p>
                  <p style={{ margin: 0, color: '#fafafa', fontSize: '16px', fontWeight: 600 }}>{o.customer_name}</p>
                </div>
                <span style={{ flexShrink: 0, fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: st.color, border: `1px solid ${st.color}`, borderRadius: '20px', padding: '4px 10px' }}>{st.label}</span>
              </div>

              <p style={{ margin: '0 0 6px', color: 'rgba(255,255,255,0.6)', fontSize: '13px', lineHeight: 1.5 }}>📍 {o.delivery_address}</p>
              {o.customer_phone && (
                <p style={{ margin: '0 0 6px', fontSize: '13px' }}>
                  <a href={`tel:${o.customer_phone.replace(/[^0-9+]/g, '')}`} style={{ color: GOLD, textDecoration: 'none' }}>📞 {o.customer_phone}</a>
                </p>
              )}
              {o.wanted_time && <p style={{ margin: '0 0 6px', color: GOLD, fontSize: '13px', fontWeight: 600 }}>🕐 Deliver at {o.wanted_time}</p>}

              {o.notes && (
                <div style={{ background: 'rgba(245,200,66,0.07)', border: '1px solid rgba(245,200,66,0.25)', borderRadius: '10px', padding: '10px 12px', margin: '10px 0' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', color: GOLD, fontWeight: 700 }}>Special instructions</p>
                  <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.8)', whiteSpace: 'pre-wrap' }}>{o.notes}</p>
                </div>
              )}

              <p style={{ margin: '10px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                {(o.order_items ?? []).map(i => `${i.quantity}× ${i.name}`).join(', ')} · R{(o.total_cents / 100).toFixed(2)} · {timeAgo(o.created_at)}
              </p>

              {action && (
                <button
                  onClick={() => advance(o, action.key)}
                  disabled={busy === o.id}
                  style={{
                    width: '100%', marginTop: '14px', padding: '16px', borderRadius: '12px', border: 'none',
                    cursor: busy === o.id ? 'wait' : 'pointer', fontSize: '13px', fontWeight: 700,
                    letterSpacing: '1.5px', textTransform: 'uppercase', color: '#0a0600',
                    background: 'linear-gradient(135deg, #f5c842, #c8940c)', opacity: busy === o.id ? 0.6 : 1,
                  }}
                >
                  {busy === o.id ? 'Saving…' : action.label}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
