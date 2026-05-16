import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabase-admin'
import { callPaystackProxy } from '../../../../../lib/paystack-proxy'

function getCallbackBaseUrl(request) {
  const envSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, '')
  const vercelUrl = process.env.VERCEL_URL?.trim().replace(/\/+$/, '')
  const forwardedHost = request.headers.get('x-forwarded-host')?.trim().replace(/\/+$/, '')
  const forwardedProto = request.headers.get('x-forwarded-proto')?.trim() || 'https'
  const requestOrigin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : new URL(request.url).origin

  return envSiteUrl || (vercelUrl ? `https://${vercelUrl}` : requestOrigin)
}

export async function POST(request) {
  try {
    const siteUrl = getCallbackBaseUrl(request)

    const { orderId, email, amountCents, customerName } = await request.json()

    if (!orderId || !email || !amountCents) {
      return NextResponse.json({ error: 'orderId, email and amountCents are required' }, { status: 400 })
    }

    const reference = `KHULA-${orderId.slice(0, 8).toUpperCase()}-${Date.now()}`
    const callbackUrl = `${siteUrl}/order-confirmed/${encodeURIComponent(orderId)}`

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
