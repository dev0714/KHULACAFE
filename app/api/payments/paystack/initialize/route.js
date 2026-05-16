import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabase-admin'
import { callPaystackProxy } from '../../../../../lib/paystack-proxy'

export async function POST(request) {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const { orderId, email, amountCents, customerName } = await request.json()

    if (!orderId || !email || !amountCents) {
      return NextResponse.json({ error: 'orderId, email and amountCents are required' }, { status: 400 })
    }

    const reference = `KHULA-${orderId.slice(0, 8).toUpperCase()}-${Date.now()}`
    const callbackUrl = `${siteUrl}/payment/verify?orderId=${encodeURIComponent(orderId)}`

    const data = await callPaystackProxy('paystack-transaction', 'initialize', {
      body: {
        email,
        amount: amountCents,
        reference,
        metadata: { orderId, customerName },
        callback_url: callbackUrl,
        channels: ['card', 'bank', 'ussd', 'bank_transfer', 'mobile_money'],
        currency: 'ZAR',
      },
    })

    await supabaseAdmin
      .from('orders')
      .update({ payment_reference: data?.data?.reference || reference })
      .eq('id', orderId)

    return NextResponse.json({
      authorizationUrl: data?.data?.authorization_url,
      reference: data?.data?.reference || reference,
    })
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Could not initialize payment' }, { status: 500 })
  }
}
