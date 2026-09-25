import { NextResponse } from 'next/server'
import { verifyToken } from '../../../../lib/auth'
import { supabaseAdmin } from '../../../../lib/supabase-admin'
import { sendOrderConfirmation, notifyStaff } from '../../../../lib/resend'
import { inBackground } from '../../../../lib/background'
import { isAllowedTime, slotsFor } from '../../../../lib/trading-hours'

function staffOrderHtml({ order, items, totalCents }) {
  const when = order.wanted_time
    ? `${order.delivery_type === 'delivery' ? 'Deliver at' : 'Collect at'}: <strong>${order.wanted_time}</strong>`
    : 'No time requested'
  const lines = items.map(i => `<tr><td style="padding:6px 0">${i.qty}x ${i.name}</td><td style="text-align:right">R${(i.price_cents * i.qty / 100).toFixed(2)}</td></tr>`).join('')
  return `
    <h2 style="margin:0 0 8px">New order ${order.id.slice(0, 8).toUpperCase()}</h2>
    <p style="margin:0 0 4px"><strong>${order.customer_name}</strong>${order.customer_phone ? ` &middot; ${order.customer_phone}` : ''}</p>
    <p style="margin:0 0 4px">${order.delivery_type === 'delivery' ? `Delivery to: ${order.delivery_address}` : 'Pickup'}</p>
    <p style="margin:0 0 16px">${when}</p>
    ${order.notes ? `<div style="background:#f9f5ec;border-left:4px solid #f5c842;padding:12px 14px;margin:0 0 16px">
      <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#a8860b;font-weight:700">Special instructions</p>
      <p style="margin:0;white-space:pre-wrap">${order.notes}</p></div>` : ''}
    <table style="width:100%;border-top:1px solid #eee">${lines}
      <tr style="border-top:1px solid #eee;font-weight:700"><td style="padding:10px 0">Total</td><td style="text-align:right">R${(totalCents / 100).toFixed(2)}</td></tr>
    </table>`
}

export async function POST(request) {
  const body = await request.json()
  const { customerName, customerEmail, customerPhone, deliveryType, deliveryAddress, wantedTime, notes, items, bucksRedeemed, customerId, voucherCode } = body

  if (!customerName || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Customer name and at least one item are required' }, { status: 400 })
  }
  if (deliveryType === 'delivery' && !deliveryAddress?.trim()) {
    return NextResponse.json({ error: 'Delivery address is required for delivery orders' }, { status: 400 })
  }
  if (wantedTime && !isAllowedTime(deliveryType, wantedTime.trim())) {
    const info = slotsFor(deliveryType)
    const msg = !info.open
      ? 'We are closed today. Please order again on Tuesday.'
      : deliveryType === 'delivery'
        ? `That time is no longer available. Deliveries run until ${info.last} today.`
        : `That time is no longer available. Collections run until ${info.close} today.`
    return NextResponse.json({ error: msg }, { status: 400 })
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
      wanted_time: wantedTime?.trim() || null,
      notes: notes?.trim() || null,
      total_cents: totalCents,
      status: 'received',
      payment_status: 'pending',
    })
    .select()
    .single()

  if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 })

  // Remember delivery details on the signed-in customer's account so their
  // next order is pre-filled on any device. Only the session owner's record
  // is ever touched, never one matched by a typed-in email.
  try {
    const token = request.cookies.get('customer_session')?.value
    const session = token ? await verifyToken(token) : null
    if (session?.role === 'customer' && session.sub) {
      const patch = { preferred_delivery_type: deliveryType }
      if (deliveryType === 'delivery' && deliveryAddress?.trim()) patch.delivery_address = deliveryAddress.trim()
      if (customerPhone?.trim()) patch.phone = customerPhone.trim()
      await supabaseAdmin.from('customers').update(patch).eq('id', session.sub)
    }
  } catch (e) { console.error('[save delivery details]', e) }

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
    order.notes = merged
  }

  const netCents = Math.max(0, totalCents - voucherCents - redeemedCents)

  // Fully covered by a voucher and/or Khula Bucks: nothing goes to Paystack,
  // so record it as paid here. Otherwise the order sat on "payment pending"
  // and the customer was never sent home from the confirmation page.
  if (netCents === 0 && (voucherCents > 0 || redeemedCents > 0)) {
    const reference = voucherCents > 0 ? `VOUCHER-${String(voucherCode).trim().toUpperCase()}` : 'KHULA-BUCKS'
    await supabaseAdmin.from('orders').update({ payment_status: 'paid', payment_reference: reference }).eq('id', order.id)
    order.payment_status = 'paid'
  }

  // Send the emails after replying, so checkout moves straight on to payment.
  inBackground('order emails', async () => {
    const mail = await Promise.allSettled([
      sendOrderConfirmation({ order, items }),
      notifyStaff({
        type: 'order',
        subject: `New order ${order.id.slice(0, 8).toUpperCase()} — ${order.customer_name}`,
        html: staffOrderHtml({ order, items, totalCents }),
      }),
    ])
    mail.forEach(r => { if (r.status === 'rejected') console.error('[order email]', r.reason) })
  })

  return NextResponse.json({ orderId: order.id, netCents, voucherCents, redeemedCents })
}
