'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase-public'
import { getDashboardChartData, getOrderCounts } from './actions'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

const GOLD = '#f5c842'
const RED = '#ff6b6b'
const GRID = '#2e2000'
const AXIS = 'rgba(255,255,255,0.25)'

function PresetTabs({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '4px', background: '#140e00', borderRadius: '8px', padding: '3px', border: '1px solid #2e2000' }}>
      {options.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)} style={{
          padding: '5px 12px', borderRadius: '5px', border: 'none', cursor: 'pointer',
          background: value === o.value ? 'linear-gradient(135deg, #f5c842, #c8940c)' : 'transparent',
          color: value === o.value ? '#0a0600' : 'rgba(255,255,255,0.4)',
          fontSize: '11px', fontWeight: value === o.value ? 700 : 400,
          transition: 'all 0.15s',
        }}>{o.label}</button>
      ))}
    </div>
  )
}

function ChartCard({ title, children, controls }) {
  return (
    <div style={{ background: '#1e1500', border: '1px solid #2e2000', borderRadius: '14px', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h3 style={{ fontFamily: 'var(--font-playfair)', color: '#fafafa', fontSize: '18px', margin: 0 }}>
          {title}
        </h3>
        {controls}
      </div>
      {children}
    </div>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#140e00', border: '1px solid #2e2000', borderRadius: '8px', padding: '10px 14px' }}>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginBottom: '6px' }}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color, fontSize: '13px', fontWeight: 600, margin: '2px 0' }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

const BUCKS_PRESETS  = [{ label: '7d', value: 7 }, { label: '14d', value: 14 }, { label: '30d', value: 30 }]
const GROWTH_PRESETS = [{ label: '3m', value: 3 }, { label: '6m', value: 6 }, { label: '12m', value: 12 }]

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    customers: 0, totalBucks: 0, activeOrders: 0, totalOrders: 0,
    categories: 0, items: 0, featured: 0,
    gallery: 0, atmosphere: 0, occasions: 0, addons: 0,
  })
  const [charts, setCharts] = useState({ bucksActivity: [], customerGrowth: [] })
  const [bucksDays, setBucksDays] = useState(7)
  const [growthMonths, setGrowthMonths] = useState(6)
  const [chartsLoading, setChartsLoading] = useState(false)

  useEffect(() => {
    // Public-table counts via anon client
    Promise.all([
      supabase.from('menu_categories').select('id', { count: 'exact', head: true }),
      supabase.from('menu_items').select('id', { count: 'exact', head: true }),
      supabase.from('menu_items').select('id', { count: 'exact', head: true }).eq('is_featured', true),
      supabase.from('gallery_items').select('id', { count: 'exact', head: true }).eq('is_atmosphere', false),
      supabase.from('gallery_items').select('id', { count: 'exact', head: true }).eq('is_atmosphere', true),
      supabase.from('booking_occasions').select('id', { count: 'exact', head: true }),
      supabase.from('booking_addons').select('id', { count: 'exact', head: true }),
    ]).then(([cats, items, featured, gallery, atm, occ, addons]) => {
      setStats(prev => ({
        ...prev,
        categories: cats.count ?? 0,
        items: items.count ?? 0,
        featured: featured.count ?? 0,
        gallery: gallery.count ?? 0,
        atmosphere: atm.count ?? 0,
        occasions: occ.count ?? 0,
        addons: addons.count ?? 0,
      }))
    })

    getOrderCounts().then(orderCounts => {
      setStats(prev => ({
        ...prev,
        activeOrders: (orderCounts.received ?? 0) + (orderCounts.making ?? 0) + (orderCounts.out_for_delivery ?? 0),
        totalOrders: orderCounts.total ?? 0,
      }))
    }).catch(() => {})
  }, [])

  useEffect(() => {
    setChartsLoading(true)
    getDashboardChartData({ bucksDays, growthMonths }).then(chartData => {
      setCharts(chartData)
      setStats(prev => ({
        ...prev,
        customers: chartData.totalCustomers ?? 0,
        totalBucks: chartData.totalBucks ?? 0,
      }))
      setChartsLoading(false)
    }).catch(() => setChartsLoading(false))
  }, [bucksDays, growthMonths])

  const statCards = [
    { label: 'Customers', value: stats.customers, icon: '👥' },
    { label: 'Khula Bucks in Circulation', value: stats.totalBucks, icon: '💛' },
    { label: 'Active Orders', value: stats.activeOrders, icon: '📦' },
    { label: 'Total Orders', value: stats.totalOrders, icon: '🧾' },
    { label: 'Menu Categories', value: stats.categories, icon: '🗂️' },
    { label: 'Menu Items', value: stats.items, icon: '🍽️' },
    { label: 'Featured Items', value: stats.featured, icon: '⭐' },
    { label: 'Gallery Photos', value: stats.gallery, icon: '📸' },
    { label: 'Atmosphere Photos', value: stats.atmosphere, icon: '🏛️' },
    { label: 'Occasions', value: stats.occasions, icon: '🎉' },
    { label: 'Add-Ons', value: stats.addons, icon: '🎁' },
  ]

  return (
    <>
      <h1 style={{ fontFamily: 'var(--font-playfair)', color: '#fafafa', fontSize: '32px', marginBottom: '4px' }}>
        Dashboard
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '40px' }}>
        Welcome back. Here's an overview of your content.
      </p>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '40px' }}>
        {statCards.map(s => (
          <div key={s.label} style={{
            background: '#1e1500', border: '1px solid #2e2000', borderRadius: '12px', padding: '20px 18px',
          }}>
            <div style={{ fontSize: '22px', marginBottom: '10px' }}>{s.icon}</div>
            <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '28px', fontWeight: 700, color: GOLD, lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.5px', marginTop: '6px', lineHeight: 1.4 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px', opacity: chartsLoading ? 0.5 : 1, transition: 'opacity 0.2s' }}>

        <ChartCard
          title="Bucks Activity"
          controls={<PresetTabs options={BUCKS_PRESETS} value={bucksDays} onChange={setBucksDays} />}
        >
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
        </ChartCard>

        <ChartCard
          title="Customer Growth"
          controls={<PresetTabs options={GROWTH_PRESETS} value={growthMonths} onChange={setGrowthMonths} />}
        >
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={charts.customerGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
              <XAxis dataKey="month" tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: GRID }} />
              <Line
                dataKey="count" name="New Customers" stroke={GOLD} strokeWidth={2.5}
                dot={{ fill: GOLD, r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: GOLD, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

      </div>
    </>
  )
}
