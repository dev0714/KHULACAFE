import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '../../../../lib/supabase-admin'
import { signToken } from '../../../../lib/auth'

function setSession(response, token) {
  response.cookies.set('customer_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })
  return response
}

export async function POST(request) {
  const { name, email, phone, password } = await request.json()

  if (!name?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: 'Name, email and password are required.' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })
  }

  const cleanEmail = email.toLowerCase().trim()
  const password_hash = await bcrypt.hash(password, 12)

  // Is there already a customer with this email (case-insensitive)?
  const { data: existing } = await supabaseAdmin
    .from('customers')
    .select('id, password_hash')
    .ilike('email', cleanEmail)
    .maybeSingle()

  let customer
  if (existing && existing.password_hash) {
    return NextResponse.json({ error: 'An account with this email already exists. Please log in.' }, { status: 409 })
  } else if (existing) {
    // Admin-added loyalty customer claiming their account — link the login.
    const { data, error } = await supabaseAdmin
      .from('customers')
      .update({ name: name.trim(), email: cleanEmail, phone: phone?.trim() || null, password_hash })
      .eq('id', existing.id)
      .select('id, name')
      .single()
    if (error) return NextResponse.json({ error: 'Could not create account. Please try again.' }, { status: 500 })
    customer = data
  } else {
    const { data, error } = await supabaseAdmin
      .from('customers')
      .insert({ name: name.trim(), email: cleanEmail, phone: phone?.trim() || null, password_hash, khula_bucks: 0, is_gold: false })
      .select('id, name')
      .single()
    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'An account with this email already exists. Please log in.' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Could not create account. Please try again.' }, { status: 500 })
    }
    customer = data
  }

  const token = await signToken({ sub: customer.id, email: cleanEmail, name: customer.name, role: 'customer' })
  return setSession(NextResponse.json({ ok: true, name: customer.name }), token)
}
