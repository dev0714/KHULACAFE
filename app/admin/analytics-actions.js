'use server'
import { cookies } from 'next/headers'
import { verifyToken } from '../../lib/auth'
import { supabaseAdmin } from '../../lib/supabase-admin'

async function assertAdmin() {
  const token = cookies().get('admin_session')?.value
  const payload = token ? await verifyToken(token) : null
  if (!payload) throw new Error('Unauthorized')
  return payload
}

const iso = (d) => d.toISOString()
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d }

// Revenue in a window. Only money actually taken counts, so unpaid orders
// are excluded rather than flattering the figure.
async function revenueBetween(fromIso, toIso) {
  const { data } = await supabaseAdmin
    .from('orders')
    .select('total_cents')
    .eq('payment_status', 'paid')
    .gte('created_at', fromIso)
    .lt('created_at', toIso)
  return (data || []).reduce((t, o) => t + (o.total_cents || 0), 0)
}

function pctChange(now, before) {
  if (!before) return now > 0 ? 100 : 0
  return Math.round(((now - before) / before) * 100)
}

// Day on day, week on week, month on month, quarter on quarter, year on year.
export async function getRevenueComparisons() {
  await assertAdmin()
  const now = new Date()
  const periods = [
    { key: 'day',     label: 'Day on day',         days: 1   },
    { key: 'week',    label: 'Week on week',       days: 7   },
    { key: 'month',   label: 'Month on month',     days: 30  },
    { key: 'quarter', label: 'Quarter on quarter', days: 91  },
    { key: 'year',    label: 'Year on year',       days: 365 },
  ]

  const out = []
  for (const p of periods) {
    const current = await revenueBetween(iso(daysAgo(p.days)), iso(now))
    const previous = await revenueBetween(iso(daysAgo(p.days * 2)), iso(daysAgo(p.days)))
    out.push({ ...p, currentCents: current, previousCents: previous, changePct: pctChange(current, previous) })
  }

  const allTime = await revenueBetween('1970-01-01T00:00:00Z', iso(now))
  return { periods: out, allTimeCents: allTime }
}

// How long the kitchen took, and how long the drive took.
// Prep  = received -> ready (falls back to out_for_delivery when no ready stamp).
// Drive = out_for_delivery -> delivered.
export async function getTimings(days = 30) {
  await assertAdmin()
  const { data: events } = await supabaseAdmin
    .from('order_status_events')
    .select('order_id, status, created_at')
    .gte('created_at', iso(daysAgo(days)))
    .order('created_at', { ascending: true })

  const byOrder = {}
  for (const e of events || []) {
    if (!byOrder[e.order_id]) byOrder[e.order_id] = {}
    // Keep the first time each status was reached.
    if (!byOrder[e.order_id][e.status]) byOrder[e.order_id][e.status] = new Date(e.created_at).getTime()
  }

  const prep = [], drive = []
  for (const stamps of Object.values(byOrder)) {
    const start = stamps.received
    const cooked = stamps.ready ?? stamps.out_for_delivery
    if (start && cooked && cooked > start) prep.push((cooked - start) / 60000)
    if (stamps.out_for_delivery && stamps.delivered && stamps.delivered > stamps.out_for_delivery) {
      drive.push((stamps.delivered - stamps.out_for_delivery) / 60000)
    }
  }

  const stat = (arr) => {
    if (arr.length === 0) return { count: 0, avg: null, fastest: null, slowest: null }
    const sorted = [...arr].sort((a, b) => a - b)
    return {
      count: arr.length,
      avg: Math.round(arr.reduce((t, n) => t + n, 0) / arr.length),
      fastest: Math.round(sorted[0]),
      slowest: Math.round(sorted[sorted.length - 1]),
    }
  }
  return { days, prep: stat(prep), delivery: stat(drive) }
}

// Most to least popular, by dish and by menu category.
export async function getPopularity(days = 90) {
  await assertAdmin()
  const { data: orders } = await supabaseAdmin
    .from('orders').select('id').gte('created_at', iso(daysAgo(days)))
  const ids = (orders || []).map(o => o.id)
  if (ids.length === 0) return { days, items: [], categories: [] }

  const { data: lines } = await supabaseAdmin
    .from('order_items').select('menu_item_id, name, quantity, price_cents').in('order_id', ids)

  const { data: menu } = await supabaseAdmin
    .from('menu_items').select('id, name, menu_categories(name)')
  const catOf = {}
  for (const m of menu || []) catOf[m.id] = m.menu_categories?.name || 'Uncategorised'

  const items = {}, categories = {}
  for (const l of lines || []) {
    const qty = l.quantity || 0
    const revenue = (l.price_cents || 0) * qty
    const key = l.name || 'Unknown'
    if (!items[key]) items[key] = { name: key, qty: 0, revenueCents: 0 }
    items[key].qty += qty
    items[key].revenueCents += revenue

    const cat = catOf[l.menu_item_id] || 'Uncategorised'
    if (!categories[cat]) categories[cat] = { name: cat, qty: 0, revenueCents: 0 }
    categories[cat].qty += qty
    categories[cat].revenueCents += revenue
  }

  const sort = (o) => Object.values(o).sort((a, b) => b.qty - a.qty)
  return { days, items: sort(items), categories: sort(categories) }
}

// New versus returning, by how many paid orders an email has placed.
export async function getCustomerMix(days = 30) {
  await assertAdmin()
  const { data: recent } = await supabaseAdmin
    .from('orders')
    .select('customer_email, created_at')
    .not('customer_email', 'is', null)
    .gte('created_at', iso(daysAgo(days)))

  const emails = [...new Set((recent || []).map(o => o.customer_email))]
  if (emails.length === 0) return { days, newCount: 0, returningCount: 0, totalCustomers: 0 }

  const { data: history } = await supabaseAdmin
    .from('orders').select('customer_email, created_at').in('customer_email', emails)

  const firstSeen = {}
  for (const o of history || []) {
    const t = new Date(o.created_at).getTime()
    if (!firstSeen[o.customer_email] || t < firstSeen[o.customer_email]) firstSeen[o.customer_email] = t
  }

  const cutoff = daysAgo(days).getTime()
  let newCount = 0, returningCount = 0
  for (const e of emails) (firstSeen[e] >= cutoff ? newCount++ : returningCount++)
  return { days, newCount, returningCount, totalCustomers: emails.length }
}

// Counts for the status tiles across the top.
export async function getStatusCounts() {
  await assertAdmin()
  const { data } = await supabaseAdmin.from('orders').select('status')
  const counts = { received: 0, making: 0, ready: 0, out_for_delivery: 0, delivered: 0 }
  for (const o of data || []) if (o.status in counts) counts[o.status]++
  return counts
}

export async function getRatingSummary() {
  await assertAdmin()
  const { data } = await supabaseAdmin
    .from('order_feedback').select('service_rating, food_rating')
  const rows = data || []
  const avg = (k) => rows.length ? (rows.reduce((t, r) => t + (r[k] || 0), 0) / rows.length) : null
  return { count: rows.length, service: avg('service_rating'), food: avg('food_rating') }
}
