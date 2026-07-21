import 'server-only'
import { cookies } from 'next/headers'
import { verifyToken } from './auth'
import { supabaseAdmin } from './supabase-admin'

// Reads the logged-in customer from the customer_session cookie, or null.
export async function getCustomer() {
  const token = cookies().get('customer_session')?.value
  const payload = token ? await verifyToken(token) : null
  if (!payload || payload.role !== 'customer') return null

  const { data } = await supabaseAdmin
    .from('customers')
    .select('id, name, email, phone, khula_bucks, is_gold, created_at')
    .eq('id', payload.sub)
    .single()
  return data || null
}

export const CUSTOMER_COOKIE = 'customer_session'
