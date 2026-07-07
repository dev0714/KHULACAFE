'use server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { verifyToken } from '../../lib/auth'
import { supabaseAdmin } from '../../lib/supabase-admin'

async function assertAdmin() {
  const token = cookies().get('admin_session')?.value
  const payload = token ? await verifyToken(token) : null
  if (!payload) throw new Error('Unauthorized')
}

// ── Menu Categories ─────────────────────────────────────────────
export async function upsertCategory(data) {
  await assertAdmin()
  if (data.id) {
    const { id, ...fields } = data
    await supabaseAdmin.from('menu_categories').update(fields).eq('id', id)
  } else {
    await supabaseAdmin.from('menu_categories').insert(data)
  }
  revalidatePath('/menu')
  revalidatePath('/admin/menu')
}

export async function deleteCategory(id) {
  await assertAdmin()
  await supabaseAdmin.from('menu_categories').delete().eq('id', id)
  revalidatePath('/menu')
  revalidatePath('/admin/menu')
}

// ── Menu Subcategories ───────────────────────────────────────────
export async function upsertSubcategory(data) {
  await assertAdmin()
  if (data.id) {
    const { id, ...fields } = data
    await supabaseAdmin.from('menu_subcategories').update(fields).eq('id', id)
  } else {
    await supabaseAdmin.from('menu_subcategories').insert(data)
  }
  revalidatePath('/menu')
  revalidatePath('/admin/menu')
}

export async function deleteSubcategory(id) {
  await assertAdmin()
  await supabaseAdmin.from('menu_subcategories').delete().eq('id', id)
  revalidatePath('/menu')
  revalidatePath('/admin/menu')
}

// ── Menu Items ───────────────────────────────────────────────────
export async function upsertMenuItem(data) {
  await assertAdmin()
  if (data.id) {
    const { id, ...fields } = data
    await supabaseAdmin.from('menu_items').update(fields).eq('id', id)
  } else {
    await supabaseAdmin.from('menu_items').insert(data)
  }
  revalidatePath('/menu')
  revalidatePath('/')
  revalidatePath('/admin/menu')
}

export async function deleteMenuItem(id) {
  await assertAdmin()
  await supabaseAdmin.from('menu_items').delete().eq('id', id)
  revalidatePath('/menu')
  revalidatePath('/')
  revalidatePath('/admin/menu')
}

// ── Gallery ──────────────────────────────────────────────────────
export async function upsertGalleryItem(data) {
  await assertAdmin()
  if (data.id) {
    const { id, ...fields } = data
    await supabaseAdmin.from('gallery_items').update(fields).eq('id', id)
  } else {
    await supabaseAdmin.from('gallery_items').insert(data)
  }
  revalidatePath('/gallery')
  revalidatePath('/')
  revalidatePath('/admin/gallery')
}

export async function deleteGalleryItem(id) {
  await assertAdmin()
  await supabaseAdmin.from('gallery_items').delete().eq('id', id)
  revalidatePath('/gallery')
  revalidatePath('/')
  revalidatePath('/admin/gallery')
}

// ── Loyalty Config ───────────────────────────────────────────────
export async function updateLoyaltyConfig(data) {
  await assertAdmin()
  await supabaseAdmin.from('loyalty_config').update(data).eq('id', 1)
  revalidatePath('/loyalty')
  revalidatePath('/admin/loyalty')
}

// ── Booking Occasions ────────────────────────────────────────────
const DEFAULT_OCCASIONS = [
  { label: 'Date Night',        emoji: '🕯️',  description: 'A romantic evening for two',                 price_cents: 10000, category: 'Romantic',         sort_order: 1  },
  { label: 'Proposal',          emoji: '💍',  description: "We'll help you create the perfect moment",   price_cents: 20000, category: 'Romantic',         sort_order: 2  },
  { label: 'Engagement',        emoji: '💑',  description: 'Celebrate your new chapter together',         price_cents: 15000, category: 'Romantic',         sort_order: 3  },
  { label: 'Anniversary',       emoji: '🥂',  description: 'Celebrate your love story',                  price_cents: 10000, category: 'Romantic',         sort_order: 4  },
  { label: "Valentine's Day",   emoji: '❤️',  description: "A special Valentine's Day experience",       price_cents: 10000, category: 'Romantic',         sort_order: 5  },
  { label: 'Team Lunch',        emoji: '💼',  description: 'Great ideas start over great food',          price_cents: 10000, category: 'Business',         sort_order: 6  },
  { label: 'Team Breakfast',    emoji: '☕',  description: 'Start the day together as a team',           price_cents: 10000, category: 'Business',         sort_order: 7  },
  { label: 'Team Supper',       emoji: '🍽️',  description: 'Unwind and connect after work',              price_cents: 10000, category: 'Business',         sort_order: 8  },
  { label: 'Interview',         emoji: '📋',  description: 'A professional setting for your meeting',    price_cents:  5000, category: 'Business',         sort_order: 9  },
  { label: 'Business Meeting',  emoji: '🤝',  description: 'Productive meetings in a great atmosphere',  price_cents:  5000, category: 'Business',         sort_order: 10 },
  { label: 'Birthday',          emoji: '🎂',  description: "We'll make them feel extra special",         price_cents: 10000, category: 'Special Occasion', sort_order: 11 },
  { label: "Mother's Day",      emoji: '🌸',  description: 'Spoil the most important woman in your life',price_cents: 10000, category: 'Special Occasion', sort_order: 12 },
  { label: "Father's Day",      emoji: '👔',  description: 'Treat Dad to an unforgettable meal',         price_cents: 10000, category: 'Special Occasion', sort_order: 13 },
  { label: 'Graduation',        emoji: '🎓',  description: 'Celebrate this incredible achievement',      price_cents: 10000, category: 'Special Occasion', sort_order: 14 },
  { label: 'Family Reunion',    emoji: '👨‍👩‍👧‍👦', description: 'Bring the family together around great food',price_cents: 15000, category: 'Special Occasion', sort_order: 15 },
  { label: 'Baby Shower',       emoji: '🍼',  description: 'Welcome the new arrival in style',           price_cents: 10000, category: 'Special Occasion', sort_order: 16 },
  { label: 'Retirement',        emoji: '🎊',  description: 'Honour a life well lived',                   price_cents: 10000, category: 'Special Occasion', sort_order: 17 },
  { label: 'Farewell',          emoji: '✈️',  description: 'Send them off in style',                     price_cents: 10000, category: 'Special Occasion', sort_order: 18 },
  { label: 'Year End Function', emoji: '🎆',  description: "Celebrate your team's achievements",         price_cents: 20000, category: 'Special Occasion', sort_order: 19 },
  { label: 'Christmas',         emoji: '🎄',  description: 'Festive cheer and great food',               price_cents: 10000, category: 'Special Occasion', sort_order: 20 },
  { label: 'Easter',            emoji: '🐣',  description: 'A special Easter celebration',               price_cents: 10000, category: 'Special Occasion', sort_order: 21 },
]

// The category column may not exist yet on older databases — retry without it
// so saves still work, and surface a clear message instead of failing silently.
function isMissingCategoryColumn(error) {
  return error?.code === 'PGRST204' || /category/.test(error?.message || '')
}

export async function seedOccasions() {
  await assertAdmin()
  const { error: delError } = await supabaseAdmin.from('booking_occasions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (delError) return { error: `Could not clear existing occasions: ${delError.message}` }

  let { error } = await supabaseAdmin.from('booking_occasions').insert(DEFAULT_OCCASIONS)
  if (error && isMissingCategoryColumn(error)) {
    const withoutCategory = DEFAULT_OCCASIONS.map(({ category, ...rest }) => rest)
    ;({ error } = await supabaseAdmin.from('booking_occasions').insert(withoutCategory))
    if (!error) return { warning: 'Occasions loaded, but the category column is missing in the database — all occasions will show under Special Occasion until it is added.' }
  }
  if (error) return { error: error.message }

  revalidatePath('/book')
  revalidatePath('/admin/bookings')
  return {}
}

export async function upsertOccasion(data) {
  await assertAdmin()
  const run = async (payload) => {
    if (payload.id) {
      const { id, ...fields } = payload
      return supabaseAdmin.from('booking_occasions').update(fields).eq('id', id)
    }
    return supabaseAdmin.from('booking_occasions').insert(payload)
  }

  let { error } = await run(data)
  if (error && isMissingCategoryColumn(error)) {
    const { category, ...withoutCategory } = data
    ;({ error } = await run(withoutCategory))
    if (!error) return { warning: 'Saved, but the category column is missing in the database — this occasion will show under Special Occasion until it is added.' }
  }
  if (error) return { error: error.message }

  revalidatePath('/book')
  revalidatePath('/admin/bookings')
  return {}
}

export async function deleteOccasion(id) {
  await assertAdmin()
  const { error } = await supabaseAdmin.from('booking_occasions').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/book')
  revalidatePath('/admin/bookings')
  return {}
}

// ── Booking Add-ons ──────────────────────────────────────────────
export async function upsertAddon(data) {
  await assertAdmin()
  if (data.id) {
    const { id, ...fields } = data
    await supabaseAdmin.from('booking_addons').update(fields).eq('id', id)
  } else {
    await supabaseAdmin.from('booking_addons').insert(data)
  }
  revalidatePath('/book')
  revalidatePath('/admin/bookings')
}

export async function deleteAddon(id) {
  await assertAdmin()
  await supabaseAdmin.from('booking_addons').delete().eq('id', id)
  revalidatePath('/book')
  revalidatePath('/admin/bookings')
}

// ── Menu Items for POS ───────────────────────────────────────────
export async function getMenuItemsForPOS() {
  await assertAdmin()
  const [{ data: cats }, { data: items }] = await Promise.all([
    supabaseAdmin.from('menu_categories').select('id, name, icon').order('sort_order'),
    supabaseAdmin.from('menu_items').select('id, name, price, price_cents, category_id').order('sort_order'),
  ])
  return (cats ?? []).map(cat => ({
    ...cat,
    menu_items: (items ?? []).filter(i => i.category_id === cat.id),
  }))
}

// ── Customer Reads ───────────────────────────────────────────────
export async function getCustomers() {
  await assertAdmin()
  const { data } = await supabaseAdmin.from('customers').select('*').order('name')
  return data ?? []
}

export async function getTransactions(customerId) {
  await assertAdmin()
  const { data } = await supabaseAdmin
    .from('transactions')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
  return data ?? []
}

// ── Customers ────────────────────────────────────────────────────
export async function upsertCustomer(data) {
  await assertAdmin()
  if (data.id) {
    const { id, ...fields } = data
    await supabaseAdmin.from('customers').update(fields).eq('id', id)
  } else {
    await supabaseAdmin.from('customers').insert(data)
  }
  revalidatePath('/admin/customers')
}

export async function deleteCustomer(id) {
  await assertAdmin()
  await supabaseAdmin.from('customers').delete().eq('id', id)
  revalidatePath('/admin/customers')
}

export async function setGoldStatus(customerId, isGold) {
  await assertAdmin()
  await supabaseAdmin.from('customers').update({ is_gold: isGold }).eq('id', customerId)
  revalidatePath('/admin/customers')
}

export async function recordPurchase(customerId, amountRands, discountPct, notes) {
  await assertAdmin()
  const { data: config } = await supabaseAdmin
    .from('loyalty_config').select('*').eq('id', 1).single()
  const earn = config?.earn_rate_points_per_rand ?? 1
  const bucksPerHundred = config?.bucks_per_100_points ?? 10
  const points = amountRands * earn
  const bucksEarned = Math.floor(points / 100 * bucksPerHundred)

  await supabaseAdmin.from('transactions').insert({
    customer_id: customerId,
    type: 'purchase',
    amount_cents: Math.round(amountRands * 100),
    bucks_earned: bucksEarned,
    bucks_redeemed: 0,
    discount_pct: discountPct || null,
    notes: notes || null,
  })
  const { data: c } = await supabaseAdmin.from('customers').select('khula_bucks').eq('id', customerId).single()
  await supabaseAdmin.from('customers').update({ khula_bucks: (c?.khula_bucks ?? 0) + bucksEarned }).eq('id', customerId)
  revalidatePath('/admin/customers')
  return { bucksEarned }
}

// ── Dashboard Charts ─────────────────────────────────────────────
export async function getDashboardChartData({ bucksDays = 7, growthMonths = 6 } = {}) {
  await assertAdmin()

  const now = new Date()

  // Bucks activity — per day over bucksDays
  const bucksFrom = new Date(now)
  bucksFrom.setDate(bucksFrom.getDate() - (bucksDays - 1))
  bucksFrom.setHours(0, 0, 0, 0)

  const { data: txRows } = await supabaseAdmin
    .from('transactions')
    .select('created_at, bucks_earned, bucks_redeemed')
    .gte('created_at', bucksFrom.toISOString())

  const bucksMap = {}
  for (let i = 0; i < bucksDays; i++) {
    const d = new Date(bucksFrom)
    d.setDate(d.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    bucksMap[key] = { day: key, earned: 0, redeemed: 0 }
  }
  for (const tx of txRows ?? []) {
    const key = tx.created_at.slice(0, 10)
    if (bucksMap[key]) {
      bucksMap[key].earned += tx.bucks_earned ?? 0
      bucksMap[key].redeemed += tx.bucks_redeemed ?? 0
    }
  }
  const bucksActivity = Object.values(bucksMap).map(r => ({
    ...r,
    day: new Date(r.day + 'T00:00:00').toLocaleDateString('en-ZA',
      bucksDays <= 14 ? { weekday: 'short', day: 'numeric' } : { day: 'numeric', month: 'short' }
    ),
  }))

  // Customer growth — per month over growthMonths
  const custFrom = new Date(now)
  custFrom.setMonth(custFrom.getMonth() - (growthMonths - 1))
  custFrom.setDate(1)
  custFrom.setHours(0, 0, 0, 0)

  const { data: custRows } = await supabaseAdmin
    .from('customers')
    .select('created_at')
    .gte('created_at', custFrom.toISOString())

  const custMap = {}
  for (let i = 0; i < growthMonths; i++) {
    const d = new Date(custFrom)
    d.setMonth(d.getMonth() + i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    custMap[key] = { month: key, count: 0 }
  }
  for (const c of custRows ?? []) {
    const key = c.created_at.slice(0, 7)
    if (custMap[key]) custMap[key].count++
  }
  const customerGrowth = Object.values(custMap).map(r => ({
    ...r,
    month: new Date(r.month + '-01').toLocaleDateString('en-ZA', { month: 'short', year: '2-digit' }),
  }))

  const { data: customerRows } = await supabaseAdmin.from('customers').select('khula_bucks')
  const totalCustomers = customerRows?.length ?? 0
  const totalBucks = (customerRows ?? []).reduce((sum, c) => sum + (c.khula_bucks ?? 0), 0)

  return { bucksActivity, customerGrowth, totalCustomers, totalBucks }
}

export async function redeemBucks(customerId, bucksAmount, notes) {
  await assertAdmin()
  const { data: c } = await supabaseAdmin.from('customers').select('khula_bucks').eq('id', customerId).single()
  if (!c || c.khula_bucks < bucksAmount) throw new Error('Insufficient Khula Bucks')
  await supabaseAdmin.from('transactions').insert({
    customer_id: customerId,
    type: 'redeem',
    amount_cents: null,
    bucks_earned: 0,
    bucks_redeemed: bucksAmount,
    notes: notes || null,
  })
  await supabaseAdmin.from('customers').update({ khula_bucks: c.khula_bucks - bucksAmount }).eq('id', customerId)
  revalidatePath('/admin/customers')
}

// ── Orders ───────────────────────────────────────────────────────
export async function getOrders() {
  await assertAdmin()
  const { data } = await supabaseAdmin
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getOrderCounts() {
  await assertAdmin()
  const { data } = await supabaseAdmin.from('orders').select('status')
  const counts = { total: 0, received: 0, making: 0, out_for_delivery: 0, delivered: 0 }
  for (const o of data ?? []) {
    counts.total++
    counts[o.status] = (counts[o.status] ?? 0) + 1
  }
  return counts
}

export async function updateOrderStatus(orderId, status) {
  await assertAdmin()
  await supabaseAdmin
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId)

  // Fire status email non-blocking
  const { data: order } = await supabaseAdmin.from('orders').select('*').eq('id', orderId).single()
  if (order?.customer_email && status !== 'received') {
    import('../../lib/resend').then(({ sendStatusUpdate }) => {
      sendStatusUpdate({ order, status }).catch(() => {})
    })
  }

  revalidatePath('/admin/orders')
}

// ── Admin Users ──────────────────────────────────────────────────
export async function getAdminUsers() {
  await assertAdmin()
  const { data } = await supabaseAdmin
    .from('admin_users')
    .select('id, name, email, created_at')
    .order('created_at', { ascending: true })
  return data ?? []
}

export async function createAdminUser(name, email, password) {
  await assertAdmin()
  const bcrypt = await import('bcryptjs')
  const password_hash = await bcrypt.hash(password, 12)
  const { error } = await supabaseAdmin.from('admin_users').insert({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password_hash,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/users')
}

export async function updateAdminUser(id, name, email, password) {
  await assertAdmin()
  const fields = { name: name.trim(), email: email.toLowerCase().trim() }
  if (password) {
    const bcrypt = await import('bcryptjs')
    fields.password_hash = await bcrypt.hash(password, 12)
  }
  const { error } = await supabaseAdmin.from('admin_users').update(fields).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/users')
}

export async function deleteAdminUser(id) {
  await assertAdmin()
  const token = cookies().get('admin_session')?.value
  const payload = token ? await verifyToken(token) : null
  if (payload?.sub === id) throw new Error('Cannot delete your own account')
  await supabaseAdmin.from('admin_users').delete().eq('id', id)
  revalidatePath('/admin/users')
}

// ── Public Booking Submission ────────────────────────────────────
export async function createBooking(data) {
  const { occasion_id, date, time, guests, customer_name, customer_email, customer_phone, add_ons, special_song, special_request, deposit_cents } = data
  const { data: booking, error } = await supabaseAdmin
    .from('bookings')
    .insert({
      occasion_id: occasion_id || null,
      date,
      time,
      guests,
      customer_name,
      customer_email: customer_email || null,
      customer_phone: customer_phone || null,
      add_ons: add_ons || [],
      special_song: special_song || null,
      special_request: special_request || null,
      deposit_cents: deposit_cents || 10000,
      status: 'pending',
    })
    .select('id, reference')
    .single()
  if (error) throw new Error(error.message)
  revalidatePath('/admin/bookings')
  return { id: booking.id, reference: booking.reference }
}

export async function getBookings() {
  await assertAdmin()
  const { data } = await supabaseAdmin
    .from('bookings')
    .select('*, booking_occasions(label, emoji)')
    .order('date', { ascending: false })
  return data ?? []
}

// ── About Images ─────────────────────────────────────────────────
export async function getAboutImages() {
  const { data } = await supabaseAdmin.from('about_images').select('slot, image_url')
  const map = {}
  for (const row of data ?? []) map[row.slot] = row.image_url
  return map
}

export async function updateAboutImage(slot, imageUrl) {
  await assertAdmin()
  await supabaseAdmin.from('about_images')
    .update({ image_url: imageUrl, updated_at: new Date().toISOString() })
    .eq('slot', slot)
  revalidatePath('/about')
  revalidatePath('/admin/gallery')
}
