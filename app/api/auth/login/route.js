import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '../../../../lib/supabase-admin'
import { signToken } from '../../../../lib/auth'

export async function POST(request) {
  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
  }

  const { data: user, error: dbError } = await supabaseAdmin
    .from('admin_users')
    .select('id, email, name, password_hash')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (dbError) console.error('[login] db error:', dbError)

  if (!user) {
    return NextResponse.json({ error: dbError ? `DB: ${dbError.message}` : 'Invalid credentials' }, { status: 401 })
  }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const token = await signToken({ sub: user.id, email: user.email, name: user.name })

  const response = NextResponse.json({ ok: true })
  response.cookies.set('admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
  return response
}
