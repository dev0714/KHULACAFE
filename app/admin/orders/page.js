'use client'
import { useState, useEffect, useCallback } from 'react'
import { getOrders, updateOrderStatus } from '../actions'

const STATUSES = [
  { key: 'received',         label: 'Received',          color: '#6b9fff', icon: '📥' },
  { key: 'making',           label: 'Being Made',        color: '#f5c842', icon: '👨‍🍳' },
  { key: 'out_for_delivery', label: 'Out for Delivery',  color: '#ff9f43', icon: '🛵' },
  { key: 'delivered',        label: 'Delivered',         color: '#26de81', icon: '✅' },
]

function statusMeta(key) { return STATUSES.find(s => s.key === key) ?? STATUSES[0] }

function nextStatus(key) {
  const idx = STATUSES.findIndex(s => s.key === key)
  return idx < STATUSES.length - 1 ? STATUSES[idx + 1] : null
}

function OrderCard({ order, onStatusChange }) {
  const [updating, setUpdating] = useState(false)
  const meta = statusMeta(order.status)
  const next = nextStatus(order.status)
  const ref = `#${order.id.slice(0, 8).toUpperCase()}`
  const time = new Date(order.created_at).toLocaleString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  async function advance() {
    if (!next) return
    setUpdating(true)
    await updateOrderStatus(order.id, next.key)
    await onStatusChange()
    setUpdating(false)
  }

  return (
    <div style={{
      background: '#1e1500', border: `1px solid ${meta.color}33`,
      borderLeft: `3px solid ${meta.color}`,
      borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ color: '#fafafa', fontWeight: 700, fontSize: '15px', margin: '0 0 2px' }}>{order.customer_name}</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: 0 }}>{ref} · {time}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: `${meta.color}18`, color: meta.color,
            padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
          }}>
            {meta.icon} {meta.label}
          </span>
        </div>
      </div>

      {/* Items */}
      <div>
        {(order.order_items ?? []).map(i => (
          <p key={i.id} style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', margin: '2px 0' }}>
            {i.quantity}× {i.name} — R{(i.price_cents * i.quantity / 100).toFixed(2)}
          </p>
        ))}
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
          {order.delivery_type === 'delivery'
            ? `🛵 Delivery — ${order.delivery_address}`
            : '🏠 Pickup'}
          {order.customer_phone && ` · ${order.customer_phone}`}
          {order.notes && <span style={{ display: 'block', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>📝 {order.notes}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: '#f5c842', fontFamily: 'var(--font-playfair)', fontSize: '18px', fontWeight: 700 }}>
            R{(order.total_cents / 100).toFixed(2)}
          </span>
          {next && (
            <button onClick={advance} disabled={updating} style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none',
              background: `linear-gradient(135deg, ${next.color}, ${next.color}bb)`,
              color: '#0a0600', fontWeight: 700, fontSize: '11px', cursor: updating ? 'not-allowed' : 'pointer',
              opacity: updating ? 0.6 : 1, letterSpacing: '0.5px',
            }}>
              {updating ? '…' : `${next.icon} Mark ${next.label}`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('active') // 'active' | 'delivered' | 'all'
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const data = await getOrders()
    setOrders(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = orders.filter(o => {
    if (filter === 'active') return o.status !== 'delivered'
    if (filter === 'delivered') return o.status === 'delivered'
    return true
  })

  const activeCount = orders.filter(o => o.status !== 'delivered').length

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h1 style={{ fontFamily: 'var(--font-playfair)', color: '#fafafa', fontSize: '28px', margin: 0 }}>Orders</h1>
        <button onClick={load} style={{ background: 'none', border: '1px solid #2e2000', borderRadius: '8px', color: 'rgba(255,255,255,0.4)', padding: '6px 14px', cursor: 'pointer', fontSize: '12px' }}>
          Refresh
        </button>
      </div>

      {/* Status legend */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {STATUSES.map(s => (
          <span key={s.key} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: s.color, background: `${s.color}15`, padding: '4px 10px', borderRadius: '20px' }}>
            {s.icon} {s.label}
          </span>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '4px', background: '#1e1500', borderRadius: '10px', padding: '4px', border: '1px solid #2e2000', marginBottom: '20px', width: 'fit-content' }}>
        {[
          { key: 'active', label: `Active${activeCount > 0 ? ` (${activeCount})` : ''}` },
          { key: 'delivered', label: 'Delivered' },
          { key: 'all', label: 'All' },
        ].map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)} style={{
            padding: '7px 18px', borderRadius: '7px', border: 'none', cursor: 'pointer',
            background: filter === t.key ? '#2e2000' : 'transparent',
            color: filter === t.key ? '#f5c842' : 'rgba(255,255,255,0.4)',
            fontSize: '12px', fontWeight: filter === t.key ? 700 : 400,
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Loading orders…</p>}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.25)', fontSize: '14px' }}>
          {filter === 'active' ? 'No active orders right now.' : 'No orders found.'}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.map(order => (
          <OrderCard key={order.id} order={order} onStatusChange={load} />
        ))}
      </div>
    </>
  )
}
