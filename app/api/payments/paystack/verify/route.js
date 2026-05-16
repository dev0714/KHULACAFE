import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabase-admin'
import { callPaystackProxy } from '../../../../../lib/paystack-proxy'

export async function GET(request) {
  try {
    const reference = request.nextUrl.searchParams.get('reference')
    const orderId = request.nextUrl.searchParams.get('orderId')

    if (!reference || !orderId) {
      return NextResponse.json({ error: 'reference and orderId are required' }, { status: 400 })
    }

    const data = await callPaystackProxy('paystack-transaction', 'verify', {
      query: { reference },
    })

    const paid = data?.data?.status === 'success'

    await supabaseAdmin.from('orders').update({
      payment_status: paid ? 'paid' : 'failed',
      payment_reference: reference,
    }).eq('id', orderId)

    return NextResponse.json({ paid })
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Could not verify payment' }, { status: 500 })
  }
}
