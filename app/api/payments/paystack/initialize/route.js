import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabase-admin'
import { initializeTransaction } from '../../../../../lib/payments'
import { getPaymentSettings } from '../../../../../lib/payment-settings'

function getCallbackBaseUrl(request) {
  const vercelUrl = process.env.VERCEL_URL?.trim().replace(/\/+$/, '')
  const forwardedHost = request.headers.get('x-forwarded-host')?.trim().replace(/\/+$/, '')
  const forwardedProto = request.headers.get('x-forwarded-proto')?.trim() || 'https'
  const requestOrigin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : new URL(request.url).origin
  return vercelUrl ? `https://${vercelUrl}` : requestOrigin
}

export async function POST(request) {
  try {
    const { orderId, email, amountCents, customerName } = await request.json()

    if (!orderId || !email || !amountCents) {
      return NextResponse.json({ error: 'orderId, email and amountCents are required' }, { status: 400 })
    }

    const settings = await getPaymentSettings()
    const siteUrl = (settings.site_url || '').trim().replace(/\/+$/, '') || getCallbackBaseUrl(request)
    const reference = `KHULA-${orderId.slice(0, 8).toUpperCase()}-${Date.now()}`
    const callbackUrl = `${siteUrl}/order-confirmed/${encodeURIComponent(orderId)}`

    const data = await initializeTransaction({
      email,
      amountCents,
      reference,
      metadata: { orderId, customerName },
      callbackUrl,
    })

    await supabaseAdmin
      .from('orders')
      .update({ payment_reference: data.reference || reference })
      .eq('id', orderId)

    return NextResponse.json({
      authorizationUrl: data.authorization_url,
      reference: data.reference || reference,
    })
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Could not initialize payment' }, { status: 500 })
  }
}
