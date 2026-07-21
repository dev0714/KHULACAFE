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
    .select('name, khula_bucks')
    .eq('id', payload.sub)
    .single()
  if (!data) return NextResponse.json({ authenticated: false })
  return NextResponse.json({ authenticated: true, name: data.name, khulaBucks: data.khula_bucks })
}
