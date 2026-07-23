import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase-admin'
import { sendOrderConfirmation } from '../../../../lib/resend'

export async function POST(request) {
  const body = await request.json()
  const { customerName, customerEmail, customerPhone, deliveryType, deliveryAddress, notes, items, bucksRedeemed, customerId, voucherCode } = body

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

  // ── Voucher — consume atomically (independent of loyalty) ──
  let voucherCents = 0
  const extraNotes = []
  if (voucherCode) {
    const { consumeVoucher } = await import('../../../../lib/vouchers')
    const vres = await consumeVoucher(voucherCode, `Order ${order.id.slice(0, 8).toUpperCase()}`)
    if (vres.amount_cents) {
      voucherCents = Math.min(vres.amount_cents, totalCents)
      extraNotes.push(`Voucher ${String(voucherCode).trim().toUpperCase()} −R${(voucherCents / 100).toFixed(2)}`)
    }
  }

  // ── Khula Bucks — redeem and/or earn ──
  let redeemedCents = 0
  if (customerEmail) {
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('id, khula_bucks')
      .eq('email', customerEmail.toLowerCase().trim())
      .single()

    const resolvedCustomer = customer || (customerId ? { id: customerId, khula_bucks: 0 } : null)

    if (resolvedCustomer) {
      const { data: cfg } = await supabaseAdmin.from('loyalty_config').select('*').eq('id', 1).single()
      const earnRate = cfg?.earn_rate_points_per_rand ?? 1
      const bucksPerHundred = cfg?.bucks_per_100_points ?? 10

      // Cap redemption so voucher + bucks never exceed the total
      const maxRedeemCents = Math.max(0, totalCents - voucherCents)
      const redeemedBucks = Math.max(0, Math.min(parseInt(bucksRedeemed) || 0, resolvedCustomer.khula_bucks, Math.floor(maxRedeemCents / 100)))
      redeemedCents = redeemedBucks * 100
      const netCents = Math.max(0, totalCents - voucherCents - redeemedCents)

      // Earn bucks on the amount actually paid with real money
      const bucks = Math.floor((netCents / 100) * earnRate / 100 * bucksPerHundred)

      if (redeemedBucks > 0 || bucks > 0) {
        await supabaseAdmin.from('transactions').insert({
          customer_id: resolvedCustomer.id,
          type: redeemedBucks > 0 ? 'redeem' : 'purchase',
          amount_cents: totalCents,
          bucks_earned: bucks,
          bucks_redeemed: redeemedBucks,
          notes: `Online order ${order.id.slice(0, 8).toUpperCase()}`,
        })
        const updatedBucks = Math.max(0, (resolvedCustomer.khula_bucks - redeemedBucks) + bucks)
        await supabaseAdmin.from('customers').update({ khula_bucks: updatedBucks }).eq('id', resolvedCustomer.id)
      }
    }
  }

  if (extraNotes.length) {
    const merged = [notes?.trim() || null, ...extraNotes].filter(Boolean).join(' · ')
    await supabaseAdmin.from('orders').update({ notes: merged }).eq('id', order.id)
  }

  const netCents = Math.max(0, totalCents - voucherCents - redeemedCents)

  // Send confirmation email (non-blocking)
  sendOrderConfirmation({ order, items }).catch(() => {})

  return NextResponse.json({ orderId: order.id, netCents, voucherCents, redeemedCents })
}
