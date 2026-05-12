import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase-admin'
import { sendOrderConfirmation } from '../../../../lib/resend'

export async function POST(request) {
  const body = await request.json()
  const { customerName, customerEmail, customerPhone, deliveryType, deliveryAddress, notes, items } = body

  if (!customerName || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Customer name and at least one item are required' }, { status: 400 })
  }
  if (deliveryType === 'delivery' && !deliveryAddress?.trim()) {
    return NextResponse.json({ error: 'Delivery address is required for delivery orders' }, { status: 400 })
  }

  const totalCents = items.reduce((sum, i) => sum + i.price_cents * i.qty, 0)

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      customer_name: customerName.trim(),
      customer_email: customerEmail?.toLowerCase().trim() || null,
      customer_phone: customerPhone?.trim() || null,
      delivery_type: deliveryType,
      delivery_address: deliveryType === 'delivery' ? deliveryAddress.trim() : null,
      notes: notes?.trim() || null,
      total_cents: totalCents,
      status: 'received',
      payment_status: 'pending',
    })
    .select()
    .single()

  if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 })

  const { error: itemsError } = await supabaseAdmin.from('order_items').insert(
    items.map(i => ({
      order_id: order.id,
      menu_item_id: i.id || null,
      name: i.name,
      quantity: i.qty,
      price_cents: i.price_cents,
    }))
  )
  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 })

  // Auto-earn Khula Bucks if email matches a loyalty customer
  if (customerEmail) {
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('id, khula_bucks')
      .eq('email', customerEmail.toLowerCase().trim())
      .single()

    if (customer) {
      const { data: cfg } = await supabaseAdmin.from('loyalty_config').select('*').eq('id', 1).single()
      const earnRate = cfg?.earn_rate_points_per_rand ?? 1
      const bucksPerHundred = cfg?.bucks_per_100_points ?? 10
      const bucks = Math.floor((totalCents / 100) * earnRate / 100 * bucksPerHundred)

      if (bucks > 0) {
        await supabaseAdmin.from('transactions').insert({
          customer_id: customer.id,
          type: 'purchase',
          amount_cents: totalCents,
          bucks_earned: bucks,
          bucks_redeemed: 0,
          notes: `Online order ${order.id.slice(0, 8).toUpperCase()}`,
        })
        await supabaseAdmin.from('customers').update({
          khula_bucks: customer.khula_bucks + bucks,
        }).eq('id', customer.id)
      }
    }
  }

  // Send confirmation email (non-blocking)
  sendOrderConfirmation({ order, items }).catch(() => {})

  return NextResponse.json({ orderId: order.id })
}
