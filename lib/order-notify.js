import 'server-only'
import { supabaseAdmin } from './supabase-admin'
import { sendCustomerStage, notifyDrivers } from './resend'

// The lifecycle an order moves through. `ready` is new: the kitchen has
// finished and the order is waiting for a driver (or the customer) to collect.
export const ORDER_STAGES = [
  { key: 'received',         label: 'Received',           driver: true,  customer: true  },
  { key: 'making',           label: 'Being made',         driver: true,  customer: true  },
  { key: 'ready',            label: 'Ready for collection', driver: true, customer: true },
  { key: 'out_for_delivery', label: 'Out for delivery',   driver: false, customer: true  },
  { key: 'delivered',        label: 'Delivered',          driver: false, customer: true  },
]

export const stageMeta = (key) => ORDER_STAGES.find(s => s.key === key) ?? ORDER_STAGES[0]
export function nextStage(key) {
  const i = ORDER_STAGES.findIndex(s => s.key === key)
  return i >= 0 && i < ORDER_STAGES.length - 1 ? ORDER_STAGES[i + 1] : null
}

// Everything a stage change should tell people, in one place so the admin
// screen and the driver screen behave identically.
export async function announceStage(orderId, stage) {
  const { data: order } = await supabaseAdmin
    .from('orders').select('*').eq('id', orderId).single()
  if (!order) return

  const meta = stageMeta(stage)
  const results = []

  // Drivers only care about a delivery order up to the point they collect it.
  if (meta.driver && order.delivery_type === 'delivery') {
    results.push(notifyDrivers({ order, stage }))
  }
  if (meta.customer) {
    results.push(sendCustomerStage({ order, stage }))
  }

  const settled = await Promise.allSettled(results)
  settled.forEach(r => { if (r.status === 'rejected') console.error('[order notify]', stage, r.reason) })
}
