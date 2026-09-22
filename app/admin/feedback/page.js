'use client'
import { useState, useEffect, useCallback } from 'react'
import { getFeedback } from '../actions'
import { PageHeader, Card, KpiTile, Avatar, Empty, Icon, Btn } from '../../../components/admin/ui'

const GOLD = 'var(--adm-gold)'
const stars = (n) => '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n)
const avg = (rows, key) => rows.length ? (rows.reduce((t, r) => t + (r[key] || 0), 0) / rows.length).toFixed(1) : '—'

export default function FeedbackPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => { setRows(await getFeedback()); setLoading(false) }, [])
  useEffect(() => { load() }, [load])

  const fiveStar = rows.filter(r => r.service_rating === 5 && r.food_rating === 5).length

  return (
    <>
      <PageHeader
        title="Ratings"
        subtitle="What customers thought of the service and the food."
        actions={<Btn onClick={load}>{Icon.refresh(16)} Refresh</Btn>}
      />

      <div className="admin-stat-grid adm-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <KpiTile label="Service" value={avg(rows, 'service_rating')} hint="Average out of 5" color={GOLD} />
        <KpiTile label="Food" value={avg(rows, 'food_rating')} hint="Average out of 5" color={GOLD} />
        <KpiTile label="Perfect scores" value={fiveStar} hint={`Of ${rows.length} ratings`} />
      </div>

      <Card style={{ overflow: 'hidden' }}>
        <div className="adm-table-head" style={{ gridTemplateColumns: 'minmax(0,1fr) 120px 120px 140px' }}>
          <span className="adm-th">Customer</span>
          <span className="adm-th">Service</span>
          <span className="adm-th">Food</span>
          <span className="adm-th">When</span>
        </div>
        {loading && <Empty>Loading…</Empty>}
        {!loading && rows.length === 0 && <Empty>No ratings yet. They arrive once orders are marked delivered.</Empty>}
        {rows.map(r => (
          <div key={r.id} className="adm-table-row adm-row" style={{ gridTemplateColumns: 'minmax(0,1fr) 120px 120px 140px', alignItems: 'start' }}>
            <div style={{ display: 'flex', gap: '12px', minWidth: 0 }}>
              <Avatar name={r.orders?.customer_name || '?'} />
              <div style={{ minWidth: 0 }}>
                <span style={{ fontSize: '14px', fontWeight: 600, display: 'block' }}>{r.orders?.customer_name || 'Unknown'}</span>
                {r.comment && <span style={{ fontSize: '12px', color: 'var(--adm-muted)', lineHeight: 1.5, display: 'block', marginTop: '4px' }}>“{r.comment}”</span>}
              </div>
            </div>
            <span style={{ color: GOLD, fontSize: '14px', letterSpacing: '1px' }}>{stars(r.service_rating)}</span>
            <span style={{ color: GOLD, fontSize: '14px', letterSpacing: '1px' }}>{stars(r.food_rating)}</span>
            <span style={{ fontSize: '12px', color: 'var(--adm-faint)' }}>
              {new Date(r.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        ))}
      </Card>
    </>
  )
}
