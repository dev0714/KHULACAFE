import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '../../../../lib/supabase-admin'
import { signToken } from '../../../../lib/auth'

export async function POST(request) {
  const { email, password } = await request.json()
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
  }

  const cleanEmail = email.toLowerCase().trim()
  const { data: customer } = await supabaseAdmin
    .from('customers')
    .select('id, name, email, password_hash')
    .ilike('email', cleanEmail)
    .maybeSingle()

  if (!customer || !customer.password_hash) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
  }

  const valid = await bcrypt.compare(password, customer.password_hash)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
  }

  const token = await signToken({ sub: customer.id, email: customer.email, name: customer.name, role: 'customer' })
  const response = NextResponse.json({ ok: true, name: customer.name })
  response.cookies.set('customer_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })
  return response
}
