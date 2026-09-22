import { Resend } from 'resend'
import nodemailer from 'nodemailer'

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

async function loadSettings() {
  try {
    const { getEmailSettings } = await import('./email-settings')
    const res = await getEmailSettings()
    return res?.row || null
  } catch {
    return null
  }
}

function fromString(settings) {
  const name = settings?.from_name || 'Khula Cafe'
  const email = settings?.from_email || 'orders@khulacafe.co.za'
  return `${name} <${email}>`
}

// Which transport should we use? SMTP when explicitly selected and configured,
// otherwise Resend (DB key or env var).
function resolveMethod(settings) {
  const explicit = settings?.send_method
  if (explicit === 'smtp') return 'smtp'
  if (explicit === 'resend') return 'resend'
  // Auto: prefer SMTP if fully configured, else Resend.
  if (settings?.smtp_host && settings?.smtp_username && settings?.smtp_password) return 'smtp'
  if (settings?.resend_api_key || process.env.RESEND_API_KEY) return 'resend'
  return null
}

// Unified low-level send. Returns { ok, error }. Never throws.
// Accepts one address or several separated by commas / semicolons / newlines.
function recipientList(to) {
  if (Array.isArray(to)) return to.map(t => String(t).trim()).filter(Boolean)
  return String(to || '').split(/[,;\n]/).map(t => t.trim()).filter(Boolean)
}

async function deliver({ to, subject, html, settings, replyTo }) {
  const recipients = recipientList(to)
  if (recipients.length === 0) return { ok: false, error: 'No recipient address.' }
  const s = settings ?? (await loadSettings())
  const method = resolveMethod(s)
  const from = fromString(s)
  const rt = replyTo || s?.reply_to || undefined

  if (method === 'smtp') {
    if (!s?.smtp_host || !s?.smtp_username || !s?.smtp_password) {
      return { ok: false, error: 'SMTP is selected but host / username / password are missing in Email Settings.' }
    }
    const port = Number(s.smtp_port) || 465
    // Standard rule: 465 = implicit TLS (secure); 587/25 = STARTTLS (secure:false,
    // upgraded after connect). Deriving from the port is more reliable than a checkbox.
    const secure = port === 465
    try {
      const transport = nodemailer.createTransport({
        host: s.smtp_host,
        port,
        secure,
        requireTLS: !secure,
        auth: { user: s.smtp_username, pass: s.smtp_password },
        connectionTimeout: 12000,
        greetingTimeout: 12000,
        socketTimeout: 20000,
      })
      await transport.sendMail({ from, to: recipients.join(', '), subject, html, replyTo: rt })
      return { ok: true }
    } catch (e) {
      let msg = e?.message || String(e)
      if (/ETIMEDOUT|ECONNREFUSED|ESOCKET|ECONNRESET|EHOSTUNREACH/i.test(msg)) {
        msg += ` — couldn't connect to ${s.smtp_host}:${port}. Try port 587 instead of 465. If that also fails, your mail host is blocking the app's server and you'll need to use Resend instead.`
      }
      return { ok: false, error: msg }
    }
  }

  if (method === 'resend') {
    const key = s?.resend_api_key || process.env.RESEND_API_KEY
    try {
      const resend = new Resend(key)
      const { data, error } = await resend.emails.send({ from, to: recipients, subject, html, replyTo: rt })
      if (error) return { ok: false, error: error.message || JSON.stringify(error) }
      return { ok: true, id: data?.id }
    } catch (e) {
      return { ok: false, error: e?.message || String(e) }
    }
  }

  return { ok: false, error: 'No sending method configured. Choose SMTP (your mail server) or add a Resend API key in Email Settings.' }
}

function shell(inner) {
  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a">
      <div style="background:#0a0600;padding:24px;text-align:center">
        <h1 style="color:#f5c842;font-size:24px;margin:0">Khula Cafe</h1>
      </div>
      <div style="padding:32px 24px">${inner}</div>
      <div style="background:#f5f5f5;padding:16px;text-align:center">
        <p style="margin:0;font-size:11px;color:#aaa">Khula Cafe · Pinetown, KwaZulu-Natal</p>
      </div>
    </div>
  `
}

export async function sendOrderConfirmation({ order, items }) {
  if (!order.customer_email) return
  const settings = await loadSettings()
  const total = `R${(order.total_cents / 100).toFixed(2)}`
  const delivery = order.delivery_type === 'delivery'
    ? `Delivery to: ${order.delivery_address}`
    : 'Pickup from Khula Cafe'

  await deliver({
    settings,
    to: order.customer_email,
    subject: `Order received ${orderRef(order.id)} — Khula Cafe`,
    html: shell(`
      <h2 style="margin:0 0 8px">Thanks for your order, ${order.customer_name}!</h2>
      <p style="color:#555">We've received your order and will start preparing it shortly.</p>
      <p><strong>Reference:</strong> ${orderRef(order.id)}<br><strong>Type:</strong> ${delivery}${order.wanted_time ? `<br><strong>${order.delivery_type === 'delivery' ? 'Delivery time' : 'Collection time'}:</strong> ${order.wanted_time}` : ''}</p>
      ${order.notes ? `<div style="background:#f9f5ec;border-left:4px solid #f5c842;padding:14px 16px;border-radius:4px;margin:20px 0">
        <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#a8860b;font-weight:700">Your special instructions</p>
        <p style="margin:0;color:#333;white-space:pre-wrap">${order.notes}</p>
      </div>` : ''}
      <table style="width:100%;border-top:1px solid #eee;margin:24px 0">
        ${itemsHtml(items)}
        <tr style="border-top:1px solid #eee;font-weight:700">
          <td style="padding:10px 0">Total</td>
          <td style="text-align:right;padding:10px 0">${total}</td>
        </tr>
      </table>
      <p style="color:#888;font-size:13px">We'll email you as your order progresses.</p>
    `),
  })
}

export async function sendContactConfirmation({ name, email }) {
  const settings = await loadSettings()
  await deliver({
    settings,
    to: email,
    subject: 'We received your message — Khula Cafe',
    html: shell(`
      <h2 style="margin:0 0 12px">Hi ${name}!</h2>
      <p style="color:#555;line-height:1.7">
        Thank you for reaching out to us. We've received your message and a member of our team will get back to you within 24 hours.
      </p>
      <p style="color:#555;line-height:1.7">
        In the meantime, feel free to WhatsApp us directly at <strong>061 489 4615</strong> for urgent queries.
      </p>
      <div style="background:#f9f5ec;border-left:4px solid #f5c842;padding:16px;border-radius:4px;margin:24px 0">
        <p style="margin:0;font-size:13px;color:#888">
          📍 Cnr Old Main Road & St Johns Avenue, Dickswell Centre, Pinetown<br>
          📞 061 489 4615<br>
          ✉️ info@khulacafe.co.za
        </p>
      </div>
      <p style="color:#888;font-size:13px">We look forward to hearing from you — see you soon at Khula Cafe!</p>
    `),
  })
}

export async function sendBookingConfirmation({ booking, occasion }) {
  if (!booking.customer_email) return
  const settings = await loadSettings()
  const deposit = `R${((booking.deposit_cents || 0) / 100).toFixed(0)}`
  const occLabel = occasion ? `${occasion.emoji || ''} ${occasion.label}`.trim() : 'Your reservation'
  const addOns = Array.isArray(booking.add_ons) ? booking.add_ons : []

  await deliver({
    settings,
    to: booking.customer_email,
    subject: `Booking confirmed ${booking.reference || ''} — Khula Cafe`.replace(/\s+—/, ' —'),
    html: shell(`
      <h2 style="margin:0 0 8px">You're all set, ${booking.customer_name}! 🎉</h2>
      <p style="color:#555;line-height:1.7">Your table is reserved. We can't wait to host you.</p>
      <table style="width:100%;border-top:1px solid #eee;border-bottom:1px solid #eee;margin:20px 0;font-size:14px">
        <tr><td style="padding:8px 0;color:#888">Occasion</td><td style="padding:8px 0;text-align:right;font-weight:600">${occLabel}</td></tr>
        <tr><td style="padding:8px 0;color:#888">Date</td><td style="padding:8px 0;text-align:right;font-weight:600">${booking.date}</td></tr>
        <tr><td style="padding:8px 0;color:#888">Time</td><td style="padding:8px 0;text-align:right;font-weight:600">${booking.time}</td></tr>
        <tr><td style="padding:8px 0;color:#888">Guests</td><td style="padding:8px 0;text-align:right;font-weight:600">${booking.guests}</td></tr>
        ${addOns.length ? `<tr><td style="padding:8px 0;color:#888">Add-ons</td><td style="padding:8px 0;text-align:right;font-weight:600">${addOns.map(a => a.label).join(', ')}</td></tr>` : ''}
        <tr><td style="padding:8px 0;color:#888">Deposit</td><td style="padding:8px 0;text-align:right;font-weight:600">${deposit} (deducted from your bill)</td></tr>
      </table>
      ${booking.reference ? `<div style="background:#f9f5ec;border:1px solid #f0e2b8;border-radius:8px;padding:16px;text-align:center;margin:20px 0">
        <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#999">Booking Reference</p>
        <p style="margin:0;font-size:22px;letter-spacing:3px;color:#0a0600;font-weight:700">${booking.reference}</p>
      </div>` : ''}
      <p style="color:#888;font-size:13px">Need to change something? Reply to this email or WhatsApp us on 061 489 4615.</p>
    `),
  })
}

// Internal notification to staff (booking / contact). No-op unless a
// notify_email is configured and notifications for that type are enabled.
export async function notifyStaff({ type, subject, html }) {
  const settings = await loadSettings()
  const to = settings?.notify_email
  if (!to) return
  if (type === 'booking' && settings?.notify_on_booking === false) return
  if (type === 'contact' && settings?.notify_on_contact === false) return
  await deliver({ settings, to, subject, html: shell(html) })
}

export async function sendStatusUpdate({ order, status }) {
  if (!order.customer_email) return
  const copy = STATUS_COPY[status]
  if (!copy) return
  const settings = await loadSettings()

  await deliver({
    settings,
    to: order.customer_email,
    subject: `${copy.subject} — ${orderRef(order.id)}`,
    html: shell(`
      <h2>${copy.subject}</h2>
      <p>${copy.body}</p>
      <p><strong>Order reference:</strong> ${orderRef(order.id)}</p>
      <p style="color:#888;font-size:13px">Thank you for choosing Khula Cafe!</p>
    `),
  })
}

// Used by the admin "Send test email" button. Returns { ok, error } so the
// admin sees exactly why a send fails (bad SMTP password, unverified domain…).
export async function sendTestEmail({ to }) {
  if (!to) return { ok: false, error: 'Enter a recipient email address first.' }
  const settings = await loadSettings()
  const method = resolveMethod(settings)
  const result = await deliver({
    settings,
    to,
    subject: 'Test email from Khula Cafe ✅',
    html: shell(`
      <h2 style="margin:0 0 8px">It works! ✅</h2>
      <p style="color:#555;line-height:1.7">Your Khula Cafe email settings are configured correctly. Booking, order, and contact-form emails will send from <strong>${fromString(settings)}</strong> via <strong>${method === 'smtp' ? 'your mail server (SMTP)' : 'Resend'}</strong>.</p>
    `),
  })
  return result
}

// ── Driver + stage notifications ────────────────────────────────────
const STAGE_COPY = {
  received:         { subject: 'Order received',            body: "We've got your order and the kitchen will start shortly." },
  making:           { subject: 'Your order is being prepared 👨‍🍳', body: 'Our kitchen has started on your order.' },
  ready:            { subject: 'Your order is ready ✅',     body: 'Your order is ready. A driver is on the way to collect it.' },
  out_for_delivery: { subject: 'Your order is on its way! 🛵', body: 'Your order has left Khula Cafe and is heading to you.' },
  delivered:        { subject: 'Order delivered! ☕',        body: 'Your order has been delivered. Enjoy!' },
}

const DRIVER_COPY = {
  received: 'A new delivery order has come in.',
  making:   'The kitchen has started on this delivery order.',
  ready:    'This order is READY FOR COLLECTION. Please collect it now.',
}

function orderSummary(order) {
  const when = order.wanted_time
    ? `<p style="margin:0 0 4px"><strong>${order.delivery_type === 'delivery' ? 'Deliver at' : 'Collect at'}:</strong> ${order.wanted_time}</p>`
    : ''
  const addr = order.delivery_type === 'delivery' && order.delivery_address
    ? `<p style="margin:0 0 4px"><strong>Address:</strong> ${order.delivery_address}</p>` : ''
  const notes = order.notes
    ? `<div style="background:#f9f5ec;border-left:4px solid #f5c842;padding:12px 14px;margin:14px 0">
         <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#a8860b;font-weight:700">Special instructions</p>
         <p style="margin:0;white-space:pre-wrap">${order.notes}</p></div>` : ''
  return `
    <p style="margin:0 0 4px"><strong>${order.customer_name}</strong>${order.customer_phone ? ` &middot; ${order.customer_phone}` : ''}</p>
    ${addr}${when}${notes}`
}

// Alerts every active driver. Drivers are admin_users with role = 'driver'.
export async function notifyDrivers({ order, stage }) {
  const { supabaseAdmin } = await import('./supabase-admin')
  const { data: drivers } = await supabaseAdmin
    .from('admin_users').select('email').eq('role', 'driver')
  const to = (drivers || []).map(d => d.email).filter(Boolean)
  if (to.length === 0) return

  const settings = await loadSettings()
  const headline = DRIVER_COPY[stage] || `Order moved to ${stage}.`
  await deliver({
    settings,
    to,
    subject: `${stage === 'ready' ? 'READY FOR COLLECTION' : 'Delivery order'} ${orderRef(order.id)}`,
    html: shell(`
      <h2 style="margin:0 0 8px">${orderRef(order.id)}</h2>
      <p style="color:#555;margin:0 0 16px">${headline}</p>
      ${orderSummary(order)}
    `),
  })
}

// Tells the customer where their order has got to.
export async function sendCustomerStage({ order, stage }) {
  if (!order.customer_email) return
  const copy = STAGE_COPY[stage]
  if (!copy) return
  const settings = await loadSettings()
  await deliver({
    settings,
    to: order.customer_email,
    subject: `${copy.subject} — ${orderRef(order.id)}`,
    html: shell(`
      <h2 style="margin:0 0 8px">${copy.subject}</h2>
      <p style="color:#555;margin:0 0 16px">${copy.body}</p>
      ${orderSummary(order)}
      <p style="color:#888;font-size:13px">Reference: ${orderRef(order.id)}</p>
    `),
  })
}

// Asks the customer to rate the service and the food out of five.
export async function sendFeedbackRequest({ order, baseUrl }) {
  if (!order.customer_email) return
  const settings = await loadSettings()
  const link = `${baseUrl}/feedback/${order.id}`
  await deliver({
    settings,
    to: order.customer_email,
    subject: `How did we do? — Khula Cafe ${orderRef(order.id)}`,
    html: shell(`
      <h2 style="margin:0 0 8px">How did we do, ${order.customer_name}?</h2>
      <p style="color:#555;line-height:1.7">
        Thank you for ordering from Khula Cafe. Please take a moment to rate our
        service and the taste of your food out of five stars. It only takes a few seconds.
      </p>
      <p style="font-size:30px;letter-spacing:6px;color:#f5c842;margin:20px 0">★★★★★</p>
      <p style="margin:24px 0">
        <a href="${link}" style="background:#f5c842;color:#0a0600;text-decoration:none;font-weight:700;padding:14px 30px;border-radius:30px;display:inline-block;letter-spacing:1px">Rate your order</a>
      </p>
      <p style="color:#888;font-size:13px">Reference: ${orderRef(order.id)}</p>
    `),
  })
}
