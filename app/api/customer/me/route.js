import { NextResponse } from 'next/server'
import { verifyToken } from '../../../../lib/auth'
import { supabaseAdmin } from '../../../../lib/supabase-admin'

export async function GET(request) {
  const token = request.cookies.get('customer_session')?.value
  const payload = token ? await verifyToken(token) : null
  if (!payload || payload.role !== 'customer') {
    return NextResponse.json({ authenticated: false })
  }
  const { data } = await supabaseAdmin
    .from('customers')
    .select('id, name, email, phone, khula_bucks')
    .eq('id', payload.sub)
    .single()
  if (!data) return NextResponse.json({ authenticated: false })
  return NextResponse.json({
    authenticated: true,
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    khulaBucks: data.khula_bucks,
  })
}
