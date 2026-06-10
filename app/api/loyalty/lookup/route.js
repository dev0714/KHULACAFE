import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase-admin'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')?.toLowerCase().trim()
  if (!email) return NextResponse.json({ found: false })

  const { data: customer } = await supabaseAdmin
    .from('customers')
    .select('id, name, khula_bucks')
    .eq('email', email)
    .single()

  if (!customer) return NextResponse.json({ found: false })

  return NextResponse.json({
    found: true,
    customerId: customer.id,
    name: customer.name,
    khulaBucks: customer.khula_bucks,
  })
}
