'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { getOrders, updateOrderStatus } from '../actions'
import { PageHeader, Card, Pill, Btn, Tabs, Icon, Empty } from '../../../components/admin/ui'

const STATUSES = [
  { key: 'received',         label: 'Received',         color: '#6b9fff' },
  { key: 'making',           label: 'Being made',       color: '#f5c842' },
  { key: 'out_for_delivery', label: 'Out for delivery', color: '#ff9f43' },
  { key: 'delivered',        label: 'Delivered',        color: '#26de81' },
]
const statusMeta = (key) => STATUSES.find(s => s.key === key) ?? STATUSES[0]
const nextStatus = (key) => { const i = STATUSES.findIndex(s => s.key === key); return i < STATUSES.length - 1 ? STATUSES[i + 1] : null }
const paymentMeta = (s) => s === 'paid' ? { label: 'Paid', color: '#26de81' } : s === 'failed' ? { label: 'Payment failed', color: '#ff6b6b' } : { label: 'Payment pending', color: '#f5c842' }
const ref = (o) => `#${o.id.slice(0, 8).toUpperCase()}`
function timeAgo(iso) {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  return h < 24 ? `${h} h ago` : new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('active')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [toast, setToast] = useState(null)
  const knownIds = useRef(null)

  const load = useCallback(async () => {
    const data = await getOrders()
    setOrders(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Poll for new orders every 15 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const data = await getOrders()
      if (knownIds.current === null) { knownIds.current = new Set(data.map(o => o.id)); return }
      const fresh = data.filter(o => !knownIds.current.has(o.id))
      if (fresh.length > 0) {
        const name = fresh[0].customer_name
        setToast(`New order from ${name}`)
        setTimeout(() => setToast(null), 7000)
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('New Khula order', { body: `Order received from ${name}`, icon: '/images/logo.png' })
        }
        setOrders(data)
        fresh.forEach(o => knownIds.current.add(o.id))
      }
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  const counts = orders.reduce((a, o) => { a[o.status] = (a[o.status] || 0) + 1; return a }, {})
  const activeCount = orders.filter(o => o.status !== 'delivered').length

  const filtered = orders.filter(o => {
    if (filter === 'active' && o.status === 'delivered') return false
    if (filter !== 'active' && filter !== 'all' && o.status !== filter) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return o.customer_name?.toLowerCase().includes(q) || ref(o).toLowerCase().includes(q) || o.customer_email?.toLowerCase().includes(q)
    }
    return true
  })

  const selected = orders.find(o => o.id === selectedId) ?? filtered[0] ?? null

  async function setStatus(order, key) {
    if (!order || order.status === key) return
    setUpdating(true)
    await updateOrderStatus(order.id, key)
    await load()
    setUpdating(false)
  }

  function requestNotifPermission() {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') Notification.requestPermission()
  }

  const tabs = [
    { key: 'active', label: 'Active', count: activeCount },
    ...STATUSES.map(s => ({ key: s.key, label: s.label, count: counts[s.key] || 0 })),
    { key: 'all', label: 'All', count: orders.length },
  ]

  return (
    <>
      {toast && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
          background: 'var(--adm-surface)', border: '1px solid var(--adm-gold)', borderRadius: '14px',
          padding: '14px 18px', color: 'var(--adm-text)', fontSize: '14px', fontWeight: 600,
          boxShadow: '0 8px 32px rgba(245,200,66,0.3)', display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <span className="adm-dot adm-live" style={{ background: '#26de81', width: '8px', height: '8px' }} />
          <span>{toast}</span>
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: 'var(--adm-faint)', cursor: 'pointer', display: 'flex' }}>{Icon.x(16)}</button>
        </div>
      )}

      <PageHeader
        title="Orders"
        subtitle="Track every order from received to delivered."
        actions={<>
          <Btn onClick={requestNotifPermission}>{Icon.bell(16)} Enable alerts</Btn>
          <Btn onClick={load}>{Icon.refresh(16)} Refresh</Btn>
        </>}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <Tabs items={tabs} value={filter} onChange={setFilter} />
        <div className="adm-search" style={{ width: '260px' }}>
          <span className="adm-search-ico">{Icon.search(16)}</span>
          <input className="adm-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or ref…" />
        </div>
      </div>

      {loading && <Empty>Loading orders…</Empty>}

      {!loading && (
        <div className="admin-chart-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.55fr) minmax(0, 1fr)', gap: '16px', alignItems: 'start' }}>
          {/* List */}
          <Card style={{ overflow: 'hidden' }}>
            <div className="adm-table-head" style={{ gridTemplateColumns: '100px minmax(0,1fr) 90px 80px 150px' }}>
              <span className="adm-th">Ref</span><span className="adm-th">Customer</span><span className="adm-th">Type</span><span className="adm-th">Total</span><span className="adm-th">Status</span>
            </div>
            {filtered.length === 0 && <Empty>{filter === 'active' ? 'No active orders right now.' : 'No orders found.'}</Empty>}
            {filtered.map(o => {
              const st = statusMeta(o.status)
              const isSel = selected?.id === o.id
              return (
                <div key={o.id} onClick={() => setSelectedId(o.id)} className="adm-table-row adm-row"
                  style={{ gridTemplateColumns: '100px minmax(0,1fr) 90px 80px 150px', cursor: 'pointer', background: isSel ? 'var(--adm-gold-soft)' : 'transparent' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--adm-gold)' }}>{ref(o)}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>{o.customer_name}</span>
                    <span style={{ fontSize: '12px', color: 'var(--adm-faint)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.customer_email || o.customer_phone || timeAgo(o.created_at)}</span>
                  </div>
                  <span style={{ fontSize: '13px', color: 'var(--adm-muted)' }}>{o.delivery_type === 'delivery' ? 'Delivery' : 'Pickup'}</span>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>R{(o.total_cents / 100).toFixed(0)}</span>
                  <Pill color={st.color}>{st.label}</Pill>
                </div>
              )
            })}
          </Card>

          {/* Detail */}
          {selected ? (() => {
            const st = statusMeta(selected.status)
            const pay = paymentMeta(selected.payment_status)
            const total = selected.total_cents / 100
            return (
              <Card style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '18px', position: 'sticky', top: '84px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span className="adm-th">Order</span>
                    <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '22px', fontWeight: 700, color: 'var(--adm-gold)' }}>{ref(selected)}</span>
                    <span style={{ fontSize: '12px', color: 'var(--adm-faint)' }}>{timeAgo(selected.created_at)} · {selected.delivery_type === 'delivery' ? 'Delivery' : 'Pickup'}</span>
                  </div>
                  <Pill color={st.color}>{st.label}</Pill>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px', borderRadius: '10px', background: 'var(--adm-page)', border: '1px solid var(--adm-border)' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{selected.customer_name}</span>
                  {selected.customer_email && <span style={{ fontSize: '12px', color: 'var(--adm-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>{Icon.at(14)} {selected.customer_email}</span>}
                  {selected.customer_phone && <span style={{ fontSize: '12px', color: 'var(--adm-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>{Icon.phone(14)} {selected.customer_phone}</span>}
                  {selected.delivery_type === 'delivery' && selected.delivery_address && <span style={{ fontSize: '12px', color: 'var(--adm-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>{Icon.truck(14)} {selected.delivery_address}</span>}
                  {selected.notes && <span style={{ fontSize: '12px', color: 'var(--adm-faint)', fontStyle: 'italic' }}>“{selected.notes}”</span>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <span className="adm-th">Items</span>
                  {(selected.order_items ?? []).map(i => (
                    <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span><span style={{ color: 'var(--adm-muted)', marginRight: '8px' }}>{i.quantity}×</span>{i.name}</span>
                      <span style={{ fontWeight: 500 }}>R{(i.price_cents * i.quantity / 100).toFixed(2)}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--adm-border)', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>Total</span>
                    <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '18px', fontWeight: 700 }}>R{total.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: pay.color }}>
                    <span>{pay.label}</span>{selected.payment_status === 'paid' && Icon.check(16)}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span className="adm-th">Update status</span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
                    {STATUSES.map(s => {
                      const on = selected.status === s.key
                      return (
                        <button key={s.key} disabled={updating || on} onClick={() => setStatus(selected, s.key)} style={{
                          height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                          fontSize: '12px', fontWeight: 600, cursor: on ? 'default' : 'pointer', fontFamily: 'inherit',
                          border: `1px solid ${on ? s.color : 'var(--adm-border)'}`, background: on ? `${s.color}1f` : 'transparent', color: on ? s.color : 'var(--adm-muted)',
                          opacity: updating && !on ? 0.6 : 1, transition: 'all .15s',
                        }}>
                          <span className="adm-dot" style={{ background: s.color }} />{s.label}
                        </button>
                      )
                    })}
                  </div>
                  {nextStatus(selected.status) && (
                    <Btn variant="primary" disabled={updating} onClick={() => setStatus(selected, nextStatus(selected.status).key)} style={{ marginTop: '4px' }}>
                      {updating ? 'Updating…' : `Mark ${nextStatus(selected.status).label} →`}
                    </Btn>
                  )}
                </div>
              </Card>
            )
          })() : (
            <Card style={{ padding: '22px' }}><Empty>Select an order to see its details.</Empty></Card>
          )}
        </div>
      )}
    </>
  )
}
