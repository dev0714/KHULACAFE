import { Resend } from 'resend'

const FROM = 'Khula Cafe <orders@khulacafe.co.za>'
function getResend() {
  if (!process.env.RESEND_API_KEY) return null
  return new Resend(process.env.RESEND_API_KEY)
}

const STATUS_COPY = {
  making:           { subject: 'Your order is being prepared 👨‍🍳', body: 'Great news — our kitchen has started on your order!' },
  out_for_delivery: { subject: 'Your order is on its way! 🛵',    body: 'Your order has left Khula Cafe and is heading your way.' },
  delivered:        { subject: 'Order delivered! ☕',              body: 'Your order has been delivered. Enjoy — and thank you for choosing Khula!' },
}

function orderRef(id) { return `#${id.slice(0, 8).toUpperCase()}` }

function itemsHtml(items) {
  return items.map(i =>
    `<tr><td style="padding:6px 0;">${i.qty}× ${i.name}</td><td style="text-align:right;padding:6px 0;">R${(i.price_cents * i.qty / 100).toFixed(2)}</td></tr>`
  ).join('')
}

export async function sendOrderConfirmation({ order, items }) {
  if (!order.customer_email) return
  const resend = getResend()
  if (!resend) return

  const total = `R${(order.total_cents / 100).toFixed(2)}`
  const delivery = order.delivery_type === 'delivery'
    ? `Delivery to: ${order.delivery_address}`
    : 'Pickup from Khula Cafe'

  await resend.emails.send({
    from: FROM,
    to: order.customer_email,
    subject: `Order received ${orderRef(order.id)} — Khula Cafe`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a">
        <div style="background:#0a0600;padding:24px;text-align:center">
          <h1 style="color:#f5c842;font-size:24px;margin:0">Khula Cafe</h1>
        </div>
        <div style="padding:32px 24px">
          <h2 style="margin:0 0 8px">Thanks for your order, ${order.customer_name}!</h2>
          <p style="color:#555">We've received your order and will start preparing it shortly.</p>
          <p><strong>Reference:</strong> ${orderRef(order.id)}<br><strong>Type:</strong> ${delivery}</p>
          <table style="width:100%;border-top:1px solid #eee;margin:24px 0">
            ${itemsHtml(items)}
            <tr style="border-top:1px solid #eee;font-weight:700">
              <td style="padding:10px 0">Total</td>
              <td style="text-align:right;padding:10px 0">${total}</td>
            </tr>
          </table>
          <p style="color:#888;font-size:13px">We'll email you as your order progresses.</p>
        </div>
      </div>
    `,
  })
}

export async function sendStatusUpdate({ order, status }) {
  if (!order.customer_email) return
  const resend = getResend()
  if (!resend) return
  const copy = STATUS_COPY[status]
  if (!copy) return

  await resend.emails.send({
    from: FROM,
    to: order.customer_email,
    subject: `${copy.subject} — ${orderRef(order.id)}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a">
        <div style="background:#0a0600;padding:24px;text-align:center">
          <h1 style="color:#f5c842;font-size:24px;margin:0">Khula Cafe</h1>
        </div>
        <div style="padding:32px 24px">
          <h2>${copy.subject}</h2>
          <p>${copy.body}</p>
          <p><strong>Order reference:</strong> ${orderRef(order.id)}</p>
          <p style="color:#888;font-size:13px">Thank you for choosing Khula Cafe!</p>
        </div>
      </div>
    `,
  })
}
