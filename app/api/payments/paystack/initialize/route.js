import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabase-admin'

export async function POST(request) {
  const secret = process.env.PAYSTACK_SECRET_KEY
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  if (!secret) {
    return NextResponse.json({ error: 'PAYSTACK_SECRET_KEY env var is not set' }, { status: 500 })
  }

  const { orderId, email, amountCents, customerName } = await request.json()

  if (!orderId || !email || !amountCents) {
    return NextResponse.json({ error: 'orderId, email and amountCents are required' }, { status: 400 })
  }

  const callbackUrl = `${siteUrl}/payment/verify?orderId=${encodeURIComponent(orderId)}`

  const resp = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: amountCents,
      reference: `KHULA-${orderId.slice(0, 8).toUpperCase()}-${Date.now()}`,
      metadata: { orderId, customerName },
      callback_url: callbackUrl,
      channels: ['card', 'bank', 'ussd', 'bank_transfer', 'mobile_money'],
      currency: 'ZAR',
    }),
  })

  const data = await resp.json()
  if (!resp.ok || !data?.status || !data?.data?.authorization_url) {
    return NextResponse.json({ error: data?.message || 'Could not initialize payment' }, { status: 500 })
  }

  await supabaseAdmin
    .from('orders')
    .update({ payment_reference: data.data.reference })
    .eq('id', orderId)

  return NextResponse.json({ authorizationUrl: data.data.authorization_url, reference: data.data.reference })
}
