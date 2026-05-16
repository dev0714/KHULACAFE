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

    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        payment_status: paid ? 'paid' : 'failed',
        payment_reference: reference,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select('id, payment_status')
      .single()

    if (updateError) {
      throw new Error(updateError.message)
    }
    if (!updatedOrder?.id) {
      throw new Error('Order not found while tagging payment status')
    }

    return NextResponse.json({ paid, paymentStatus: updatedOrder.payment_status })
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Could not verify payment' }, { status: 500 })
  }
}
