'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getDashboardChartData, getOrderCounts, getOrders, getBookings } from './actions'
import {
  getRevenueComparisons, getTimings, getPopularity,
  getCustomerMix, getStatusCounts, getRatingSummary,
} from './analytics-actions'
import { getUnreadMessageCount } from './messages/actions'
import { PageHeader, KpiTile, Card, Pill, Icon, Empty } from '../../components/admin/ui'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

const GOLD = '#f5c842'
const RED = '#ff6b6b'
const GRID = '#2e2000'
const AXIS = 'rgba(255,255,255,0.25)'

const ORDER_STATUS = {
  received:         { label: 'Received',         color: '#6b9fff' },
  making:           { label: 'Being made',       color: '#f5c842' },
  ready:            { label: 'Ready',            color: '#26de81' },
  out_for_delivery: { label: 'Out for delivery', color: '#ff9f43' },
  delivered:        { label: 'Delivered',        color: '#26de81' },
}
const BOOKING_STATUS = { pending: '#f5c842', confirmed: '#26de81', cancelled: '#ff6b6b', completed: 'rgba(255,255,255,0.4)' }

const rands = (cents) => `R${Math.round((cents || 0) / 100).toLocaleString('en-ZA')}`
const mins = (n) => n === null ? '—' : n < 60 ? `${n} min` : `${Math.floor(n / 60)}h ${n % 60}m`

// A big tappable tile that filters the orders list.
function StatusButton({ href, label, count, color }) {
  return (
    <Link href={href} className="adm-card hover" style={{
      textDecoration: 'none', padding: '18px', display: 'flex', flexDirection: 'column',
      gap: '6px', borderLeft: `3px solid ${color}`,
    }}>
      <span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--adm-text)', lineHeight: 1 }}>{count}</span>
      <span style={{ fontSize: '12px', color: 'var(--adm-muted)', fontWeight: 600 }}>{label}</span>
    </Link>
  )
}

function Delta({ pct }) {
  const up = pct >= 0
  return (
    <span style={{
      fontSize: '12px', fontWeight: 700,
      color: up ? '#26de81' : '#ff6b6b',
    }}>{up ? '▲' : '▼'} {Math.abs(pct)}%</span>
  )
}

// Horizontal bar, longest first, so popularity reads at a glance.
function RankBar({ name, qty, max, revenueCents }) {
  const pct = max ? Math.round((qty / max) * 100) : 0
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '12px' }}>
        <span style={{ color: 'var(--adm-text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
        <span style={{ color: 'var(--adm-faint)', flexShrink: 0 }}>{qty} sold · {rands(revenueCents)}</span>
      </div>
      <div style={{ height: '7px', borderRadius: '4px', background: 'var(--adm-page)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,#f5c842,#c8940c)' }} />
      </div>
    </div>
  )
}

function PresetTabs({ options, value, onChange }) {
  return (
    <div className="adm-tabs" style={{ padding: '3px' }}>
      {options.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)} className={`adm-tab${value === o.value ? ' active' : ''}`} style={{ padding: '5px 12px', fontSize: '11px' }}>{o.label}</button>
      ))}
    </div>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#140e00', border: '1px solid #2e2000', borderRadius: '8px', padding: '10px 14px' }}>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginBottom: '6px' }}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color, fontSize: '13px', fontWeight: 600, margin: '2px 0' }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

const BUCKS_PRESETS  = [{ label: '7d', value: 7 }, { label: '14d', value: 14 }, { label: '30d', value: 30 }]
const GROWTH_PRESETS = [{ label: '3m', value: 3 }, { label: '6m', value: 6 }, { label: '12m', value: 12 }]

function timeAgo(iso) {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min`
  const h = Math.round(m / 60)
  return h < 24 ? `${h} h` : `${Math.round(h / 24)} d`
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ customers: 0, totalBucks: 0, activeOrders: 0, totalOrders: 0 })
  const [liveOrders, setLiveOrders] = useState([])
  const [todayBookings, setTodayBookings] = useState([])
  const [pendingBookings, setPendingBookings] = useState(0)
  const [unread, setUnread] = useState(0)
  const [charts, setCharts] = useState({ bucksActivity: [], customerGrowth: [] })
  const [bucksDays, setBucksDays] = useState(7)
  const [growthMonths, setGrowthMonths] = useState(6)
  const [chartsLoading, setChartsLoading] = useState(false)
  const [statusCounts, setStatusCounts] = useState(null)
  const [revenue, setRevenue] = useState(null)
  const [timings, setTimings] = useState(null)
  const [popularity, setPopularity] = useState(null)
  const [mix, setMix] = useState(null)
  const [ratings, setRatings] = useState(null)
  const [popView, setPopView] = useState('categories')

  useEffect(() => {
    getOrderCounts().then(c => setStats(p => ({
      ...p,
      activeOrders: (c.received ?? 0) + (c.making ?? 0) + (c.out_for_delivery ?? 0),
      totalOrders: c.total ?? 0,
    }))).catch(() => {})
    getOrders().then(all => setLiveOrders(all.filter(o => o.status !== 'delivered').slice(0, 5))).catch(() => {})
    getBookings().then(all => {
      const today = new Date().toISOString().slice(0, 10)
      setTodayBookings(all.filter(b => b.date === today && b.status !== 'cancelled').sort((a, b) => (a.time || '').localeCompare(b.time || '')))
      setPendingBookings(all.filter(b => b.status === 'pending').length)
    }).catch(() => {})
    getUnreadMessageCount().then(setUnread).catch(() => {})
    getStatusCounts().then(setStatusCounts).catch(() => {})
    getRevenueComparisons().then(setRevenue).catch(() => {})
    getTimings(30).then(setTimings).catch(() => {})
    getPopularity(90).then(setPopularity).catch(() => {})
    getCustomerMix(30).then(setMix).catch(() => {})
    getRatingSummary().then(setRatings).catch(() => {})
  }, [])

  useEffect(() => {
    setChartsLoading(true)
    getDashboardChartData({ bucksDays, growthMonths }).then(d => {
      setCharts(d)
      setStats(p => ({ ...p, customers: d.totalCustomers ?? 0, totalBucks: d.totalBucks ?? 0 }))
      setChartsLoading(false)
    }).catch(() => setChartsLoading(false))
  }, [bucksDays, growthMonths])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr = new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' })

  const attention = [
    unread > 0 && { text: `${unread} unread message${unread > 1 ? 's' : ''}`, sub: 'Contact form', href: '/admin/messages', color: GOLD },
    pendingBookings > 0 && { text: `${pendingBookings} booking${pendingBookings > 1 ? 's' : ''} awaiting confirmation`, sub: 'Bookings', href: '/admin/bookings', color: '#ff9f43' },
    stats.activeOrders > 0 && { text: `${stats.activeOrders} open order${stats.activeOrders > 1 ? 's' : ''} in progress`, sub: 'Orders', href: '/admin/orders', color: '#6b9fff' },
  ].filter(Boolean)

  return (
    <>
      <PageHeader
        title={`${greeting}`}
        subtitle={`${dateStr} · here’s what’s happening at Khula today.`}
        actions={<Link href="/admin/bookings" className="adm-btn adm-btn-primary">{Icon.plus(16)} New booking</Link>}
      />

      {/* KPIs */}
      <div className="admin-stat-grid adm-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <KpiTile label="Open orders" value={stats.activeOrders} hint={`${stats.totalOrders} total orders`} />
        <KpiTile label="Bookings today" value={todayBookings.length} hint={pendingBookings ? `${pendingBookings} pending overall` : 'All confirmed'} />
        <KpiTile label="Customers" value={stats.customers} hint="Loyalty members" />
        <KpiTile label="Khula Bucks issued" value={stats.totalBucks} hint="In circulation" color={GOLD} />
      </div>

      {/* Order pipeline — each tile opens that filter in Orders */}
      <p className="adm-th" style={{ marginBottom: '10px' }}>Order pipeline</p>
      <div className="admin-stat-grid adm-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <StatusButton href="/admin/orders" label="Open orders" count={(statusCounts?.received ?? 0) + (statusCounts?.making ?? 0) + (statusCounts?.ready ?? 0) + (statusCounts?.out_for_delivery ?? 0)} color="#6b9fff" />
        <StatusButton href="/admin/orders" label="Being made" count={statusCounts?.making ?? 0} color="#f5c842" />
        <StatusButton href="/admin/orders" label="Ready for collection" count={statusCounts?.ready ?? 0} color="#26de81" />
        <StatusButton href="/admin/orders" label="Delivered" count={statusCounts?.delivered ?? 0} color="rgba(255,255,255,0.4)" />
      </div>

      {/* Revenue */}
      <Card style={{ padding: '22px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px', marginBottom: '18px', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '17px', fontWeight: 700 }}>Revenue received</span>
          <span style={{ fontSize: '13px', color: 'var(--adm-faint)' }}>
            All time <strong style={{ color: GOLD, fontSize: '17px', marginLeft: '6px' }}>{revenue ? rands(revenue.allTimeCents) : '—'}</strong>
          </span>
        </div>
        {!revenue ? <Empty>Loading…</Empty> : (
          <div className="admin-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '14px' }}>
            {revenue.periods.map(p => (
              <div key={p.key} style={{ padding: '14px', borderRadius: '10px', background: 'var(--adm-page)', border: '1px solid var(--adm-border)' }}>
                <p className="adm-label" style={{ marginBottom: '6px' }}>{p.label}</p>
                <p style={{ margin: '0 0 4px', fontSize: '19px', fontWeight: 700, color: 'var(--adm-text)' }}>{rands(p.currentCents)}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Delta pct={p.changePct} />
                  <span style={{ fontSize: '11px', color: 'var(--adm-faint)' }}>was {rands(p.previousCents)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        <p style={{ margin: '14px 0 0', fontSize: '11px', color: 'var(--adm-faint)' }}>
          Counts paid orders only. Each period is compared with the one immediately before it.
        </p>
      </Card>

      {/* Timings + customer mix + ratings */}
      <div className="admin-chart-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <Card style={{ padding: '22px' }}>
          <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '17px', fontWeight: 700 }}>Kitchen &amp; delivery times</span>
          <p style={{ fontSize: '11px', color: 'var(--adm-faint)', margin: '4px 0 16px' }}>Last 30 days</p>
          {!timings ? <Empty>Loading…</Empty> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[{ t: 'Food preparation', d: timings.prep, hint: 'Order received until ready' },
                { t: 'Delivery', d: timings.delivery, hint: 'Left the shop until delivered' }].map(row => (
                <div key={row.t} style={{ padding: '14px', borderRadius: '10px', background: 'var(--adm-page)', border: '1px solid var(--adm-border)' }}>
                  <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: 600 }}>{row.t}</p>
                  <p style={{ margin: '0 0 8px', fontSize: '11px', color: 'var(--adm-faint)' }}>{row.hint}</p>
                  <p style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 700, color: GOLD }}>{mins(row.d.avg)}</p>
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--adm-faint)' }}>
                    {row.d.count === 0 ? 'No completed orders yet' : `Fastest ${mins(row.d.fastest)} · slowest ${mins(row.d.slowest)} · ${row.d.count} orders`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card style={{ padding: '22px' }}>
          <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '17px', fontWeight: 700 }}>New vs returning</span>
          <p style={{ fontSize: '11px', color: 'var(--adm-faint)', margin: '4px 0 16px' }}>Customers who ordered in the last 30 days</p>
          {!mix ? <Empty>Loading…</Empty> : mix.totalCustomers === 0 ? <Empty>No orders in this period.</Empty> : (
            <>
              <div style={{ display: 'flex', height: '10px', borderRadius: '6px', overflow: 'hidden', marginBottom: '16px', background: 'var(--adm-page)' }}>
                <div style={{ width: `${(mix.newCount / mix.totalCustomers) * 100}%`, background: GOLD }} />
                <div style={{ width: `${(mix.returningCount / mix.totalCustomers) * 100}%`, background: '#6b9fff' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <span className="adm-dot" style={{ background: GOLD }} />New customers
                  </span>
                  <strong style={{ fontSize: '18px' }}>{mix.newCount}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <span className="adm-dot" style={{ background: '#6b9fff' }} />Returning customers
                  </span>
                  <strong style={{ fontSize: '18px' }}>{mix.returningCount}</strong>
                </div>
              </div>
              <Link href="/admin/customers" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '18px', fontSize: '12px', fontWeight: 600, color: GOLD, textDecoration: 'none' }}>
                View all customers {Icon.chev(14)}
              </Link>
            </>
          )}
        </Card>

        <Card style={{ padding: '22px' }}>
          <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '17px', fontWeight: 700 }}>Customer reviews</span>
          <p style={{ fontSize: '11px', color: 'var(--adm-faint)', margin: '4px 0 16px' }}>Ratings out of five</p>
          {!ratings ? <Empty>Loading…</Empty> : ratings.count === 0 ? (
            <Empty>No ratings yet. They arrive once orders are marked delivered.</Empty>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[{ k: 'Service', v: ratings.service }, { k: 'Food', v: ratings.food }].map(r => (
                <div key={r.k}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px' }}>{r.k}</span>
                    <strong style={{ fontSize: '17px', color: GOLD }}>{r.v?.toFixed(1)}</strong>
                  </div>
                  <span style={{ color: GOLD, fontSize: '17px', letterSpacing: '2px' }}>
                    {'★★★★★'.slice(0, Math.round(r.v))}{'☆☆☆☆☆'.slice(0, 5 - Math.round(r.v))}
                  </span>
                </div>
              ))}
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--adm-faint)' }}>From {ratings.count} rating{ratings.count === 1 ? '' : 's'}</p>
            </div>
          )}
          <Link href="/admin/feedback" className="adm-btn" style={{ marginTop: '18px', width: '100%', justifyContent: 'center', textDecoration: 'none' }}>
            View all reviews
          </Link>
        </Card>
      </div>

      {/* Popularity */}
      <Card style={{ padding: '22px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '17px', fontWeight: 700 }}>Most to least popular</span>
          <PresetTabs
            options={[{ value: 'categories', label: 'By category' }, { value: 'items', label: 'By dish' }]}
            value={popView}
            onChange={setPopView}
          />
        </div>
        <p style={{ fontSize: '11px', color: 'var(--adm-faint)', margin: '0 0 18px' }}>Last 90 days, ordered by quantity sold</p>
        {!popularity ? <Empty>Loading…</Empty> : (() => {
          const rows = (popView === 'categories' ? popularity.categories : popularity.items).slice(0, 12)
          if (rows.length === 0) return <Empty>No orders in this period yet.</Empty>
          const max = rows[0]?.qty || 1
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {rows.map(r => <RankBar key={r.name} name={r.name} qty={r.qty} max={max} revenueCents={r.revenueCents} />)}
            </div>
          )
        })()}
      </Card>

      {/* Live orders + side column */}
      <div className="admin-chart-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: '16px', marginBottom: '20px' }}>
        <Card style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '17px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="adm-dot adm-live" style={{ background: '#26de81', width: '8px', height: '8px' }} />Live orders
            </span>
            <Link href="/admin/orders" style={{ fontSize: '12px', fontWeight: 600, color: GOLD, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>View all {Icon.chev(14)}</Link>
          </div>
          {liveOrders.length === 0 ? <Empty>No open orders right now.</Empty> : (
            <div className="adm-stagger" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {liveOrders.map(o => {
                const st = ORDER_STATUS[o.status] ?? ORDER_STATUS.received
                const items = (o.order_items ?? []).map(i => `${i.quantity}× ${i.name}`).join(', ')
                return (
                  <Link key={o.id} href="/admin/orders" className="adm-row" style={{
                    display: 'grid', gridTemplateColumns: '90px minmax(0,1fr) 80px auto 56px', alignItems: 'center', gap: '12px',
                    padding: '12px 14px', borderRadius: '10px', background: 'var(--adm-page)', border: '1px solid var(--adm-border)', textDecoration: 'none',
                  }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: GOLD }}>#{o.id.slice(0, 8).toUpperCase()}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span style={{ fontSize: '13px', color: 'var(--adm-text)', fontWeight: 500 }}>{o.customer_name}</span>
                      <span style={{ fontSize: '12px', color: 'var(--adm-faint)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{items || '—'}</span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--adm-text)' }}>R{(o.total_cents / 100).toFixed(0)}</span>
                    <Pill color={st.color}>{st.label}</Pill>
                    <span style={{ fontSize: '11px', color: 'var(--adm-faint)', textAlign: 'right' }}>{timeAgo(o.created_at)}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '17px', fontWeight: 700 }}>Today’s bookings</span>
              <Link href="/admin/bookings" style={{ fontSize: '12px', fontWeight: 600, color: GOLD, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>All {Icon.chev(14)}</Link>
            </div>
            {todayBookings.length === 0 ? <span style={{ fontSize: '13px', color: 'var(--adm-faint)' }}>No bookings for today.</span> : todayBookings.slice(0, 5).map(b => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '52px', height: '44px', borderRadius: '10px', background: 'var(--adm-page)', border: '1px solid var(--adm-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, color: BOOKING_STATUS[b.status] ?? GOLD, flexShrink: 0 }}>{b.time}</div>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                  <span style={{ fontSize: '13px', fontWeight: 500 }}>{b.customer_name}</span>
                  <span style={{ fontSize: '12px', color: 'var(--adm-faint)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {b.guests} guests · {b.booking_occasions?.label || 'Booking'}{b.occasion_reason ? ` · ${b.occasion_reason}` : ''}
                  </span>
                </div>
              </div>
            ))}
          </Card>

          <Card style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '17px', fontWeight: 700 }}>Needs attention</span>
            {attention.length === 0 ? <span style={{ fontSize: '13px', color: 'var(--adm-faint)' }}>All clear — nothing waiting on you.</span> : attention.map(a => (
              <Link key={a.text} href={a.href} className="adm-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', background: 'var(--adm-page)', border: '1px solid var(--adm-border)', textDecoration: 'none' }}>
                <span className="adm-dot" style={{ background: a.color, width: '8px', height: '8px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <span style={{ fontSize: '13px', color: 'var(--adm-text)' }}>{a.text}</span>
                  <span style={{ fontSize: '11px', color: 'var(--adm-faint)' }}>{a.sub}</span>
                </div>
                <span style={{ color: 'var(--adm-faint)', display: 'flex' }}>{Icon.chev(16)}</span>
              </Link>
            ))}
          </Card>
        </div>
      </div>

      {/* Charts */}
      <div className="admin-chart-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '16px', opacity: chartsLoading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
        <Card style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '17px', fontWeight: 700 }}>Bucks activity</span>
            <PresetTabs options={BUCKS_PRESETS} value={bucksDays} onChange={setBucksDays} />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={charts.bucksActivity} barGap={4} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
              <XAxis dataKey="day" tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Legend wrapperStyle={{ fontSize: '11px', color: AXIS, paddingTop: '12px' }} />
              <Bar dataKey="earned" name="Earned" fill={GOLD} radius={[4, 4, 0, 0]} />
              <Bar dataKey="redeemed" name="Redeemed" fill={RED} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '17px', fontWeight: 700 }}>Customer growth</span>
            <PresetTabs options={GROWTH_PRESETS} value={growthMonths} onChange={setGrowthMonths} />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={charts.customerGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
              <XAxis dataKey="month" tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: GRID }} />
              <Line dataKey="count" name="New customers" stroke={GOLD} strokeWidth={2.5} dot={{ fill: GOLD, r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: GOLD, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </>
  )
}
