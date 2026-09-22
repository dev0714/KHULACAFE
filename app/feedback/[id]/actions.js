'use server'
import { supabaseAdmin } from '../../../lib/supabase-admin'

// Public on purpose: the order id acts as the token, and a unique index on
// order_id means an order can only ever be rated once.
export async function submitFeedback({ orderId, service, food, comment }) {
  const s = Number(service), f = Number(food)
  if (!orderId) return { error: 'Missing order.' }
  if (!(s >= 1 && s <= 5) || !(f >= 1 && f <= 5)) return { error: 'Please rate both out of five.' }

  const { data: order } = await supabaseAdmin.from('orders').select('id').eq('id', orderId).single()
  if (!order) return { error: 'We could not find that order.' }

  const { error } = await supabaseAdmin.from('order_feedback').insert({
    order_id: orderId,
    service_rating: s,
    food_rating: f,
    comment: (comment || '').trim().slice(0, 500) || null,
  })
  if (error) {
    if (error.code === '23505') return { ok: true } // already rated
    return { error: 'Could not save your rating. Please try again.' }
  }
  return { ok: true }
}
