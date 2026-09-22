'use server'
import { supabaseAdmin } from '../../../lib/supabase-admin'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const isClosed = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00')
  return Number.isNaN(d.getTime()) ? true : (d.getDay() === 0 || d.getDay() === 1)
}

export async function getBookingForCustomer(id) {
  if (!id) return null
  const { data } = await supabaseAdmin
    .from('bookings')
    .select('*, booking_occasions(label, emoji)')
    .eq('id', id)
    .single()
  return data || null
}

// Suggest the next open dates, skipping Sundays and Mondays. Offered before
// anyone is allowed near the cancel button, because the deposit does not
// come back but it does move with the booking.
export async function getAlternativeDates(fromDate) {
  const start = fromDate ? new Date(fromDate + 'T00:00:00') : new Date()
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const cursor = start > today ? start : today

  const out = []
  const d = new Date(cursor)
  d.setDate(d.getDate() + 1)
  while (out.length < 8) {
    const iso = d.toISOString().slice(0, 10)
    if (!isClosed(iso)) {
      out.push({
        date: iso,
        label: d.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' }),
      })
    }
    d.setDate(d.getDate() + 1)
  }
  return out
}

// Move the booking. The deposit stays on it, which is the whole point.
export async function rescheduleBooking(id, newDate, newTime) {
  if (!id || !newDate || !newTime) return { error: 'Please choose a date and a time.' }
  if (isClosed(newDate)) {
    const d = new Date(newDate + 'T00:00:00')
    return { error: `We are closed on ${DAY_NAMES[d.getDay()]}s. Please choose another day.` }
  }
  const todayIso = new Date().toISOString().slice(0, 10)
  if (newDate < todayIso) return { error: 'Please choose a date in the future.' }

  const { data: booking } = await supabaseAdmin.from('bookings').select('*').eq('id', id).single()
  if (!booking) return { error: 'We could not find that booking.' }
  if (booking.status === 'cancelled') return { error: 'That booking has already been cancelled.' }

  const { error } = await supabaseAdmin.from('bookings').update({
    date: newDate,
    time: newTime,
    previous_date: booking.date,
    previous_time: booking.time,
    rescheduled_count: (booking.rescheduled_count || 0) + 1,
  }).eq('id', id)
  if (error) return { error: 'Could not move your booking. Please try again.' }

  try {
    const { notifyStaff, sendBookingConfirmation } = await import('../../../lib/resend')
    const updated = { ...booking, date: newDate, time: newTime }
    const { data: occ } = booking.occasion_id
      ? await supabaseAdmin.from('booking_occasions').select('label, emoji').eq('id', booking.occasion_id).single()
      : { data: null }
    await Promise.allSettled([
      sendBookingConfirmation({ booking: updated, occasion: occ }),
      notifyStaff({
        type: 'booking',
        subject: `Booking moved — ${booking.customer_name}`,
        html: `<h2>Booking moved</h2>
          <p><strong>${booking.customer_name}</strong> moved their booking.</p>
          <p>From ${booking.date} at ${booking.time}<br>To <strong>${newDate} at ${newTime}</strong></p>
          <p>Deposit of R${((booking.deposit_cents || 0) / 100).toFixed(0)} carries over.</p>`,
      }),
    ])
  } catch (e) { console.error('[reschedule mail]', e) }

  return { ok: true, date: newDate, time: newTime }
}

// Seven working days from today, skipping Saturdays and Sundays.
function workingDaysFrom(days) {
  const d = new Date()
  let left = days
  while (left > 0) {
    d.setDate(d.getDate() + 1)
    const wd = d.getDay()
    if (wd !== 0 && wd !== 6) left--
  }
  return d.toISOString().slice(0, 10)
}

// Cancel, but only with a reason attached.
export async function cancelBooking(id, reason) {
  const text = (reason || '').trim()
  if (!id) return { error: 'Missing booking.' }
  if (text.length < 5) return { error: 'Please tell us briefly why you are cancelling.' }

  const { data: booking } = await supabaseAdmin.from('bookings').select('*').eq('id', id).single()
  if (!booking) return { error: 'We could not find that booking.' }
  if (booking.status === 'cancelled') return { ok: true }

  const dueBy = workingDaysFrom(7)
  const { error } = await supabaseAdmin.from('bookings').update({
    status: 'cancelled',
    cancellation_reason: text.slice(0, 500),
    cancelled_at: new Date().toISOString(),
    refund_status: booking.deposit_cents > 0 ? 'due' : null,
    refund_due_by: booking.deposit_cents > 0 ? dueBy : null,
  }).eq('id', id)
  if (error) return { error: 'Could not cancel your booking. Please try again.' }

  try {
    const { notifyStaff } = await import('../../../lib/resend')
    await notifyStaff({
      type: 'booking',
      subject: `Booking CANCELLED — ${booking.customer_name}`,
      html: `<h2>Booking cancelled</h2>
        <p><strong>${booking.customer_name}</strong>${booking.customer_phone ? ` · ${booking.customer_phone}` : ''}</p>
        <p>Was booked for ${booking.date} at ${booking.time} for ${booking.guests} guest(s).</p>
        <div style="background:#f9f5ec;border-left:4px solid #f5c842;padding:12px 14px;margin:14px 0">
          <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#a8860b;font-weight:700">Reason given</p>
          <p style="margin:0;white-space:pre-wrap">${text}</p>
        </div>
        <p><strong>Refund due:</strong> R${((booking.deposit_cents || 0) / 100).toFixed(0)}, to be processed by <strong>${dueBy}</strong> (7 working days).</p>`,
    })
  } catch (e) { console.error('[cancel mail]', e) }

  return { ok: true, refundDueBy: dueBy, depositCents: booking.deposit_cents || 0 }
}
