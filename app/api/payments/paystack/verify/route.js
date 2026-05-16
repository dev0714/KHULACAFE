import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabase-admin'

export async function GET(request) {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) {
    return NextResponse.json({ error: 'PAYSTACK_SECRET_KEY env var is not set' }, { status: 500 })
  }

  const reference = request.nextUrl.searchParams.get('reference')
  const orderId = request.nextUrl.searchParams.get('orderId')

  if (!reference || !orderId) {
    return NextResponse.json({ error: 'reference and orderId are required' }, { status: 400 })
  }

  const resp = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
  })
  const data = await resp.json()

  if (!resp.ok || !data?.status) {
    return NextResponse.json({ error: data?.message || 'Could not verify payment' }, { status: 500 })
  }

  const paid = data?.data?.status === 'success'

  await supabaseAdmin.from('orders').update({
    payment_status: paid ? 'paid' : 'failed',
    payment_reference: reference,
  }).eq('id', orderId)

  return NextResponse.json({ paid })
}
