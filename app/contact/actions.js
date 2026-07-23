'use server'
import { supabaseAdmin } from '../../lib/supabase-admin'
import { sendContactConfirmation, notifyStaff } from '../../lib/resend'

export async function submitContactMessage({ name, email, phone, message }) {
  const { error } = await supabaseAdmin
    .from('contact_messages')
    .insert({ name, email: email.trim().toLowerCase(), phone: phone || null, message })

  if (error) {
    console.error('contact_messages insert error:', error)
    throw new Error('Failed to save message. Please try again.')
  }

  // Confirm to the customer + notify staff, but DON'T make the customer wait on
  // email delivery (which can be slow/unavailable). The message is already
  // saved for staff. Cap the wait at 3s so the form responds fast.
  const emails = Promise.allSettled([
    sendContactConfirmation({ name, email }),
    notifyStaff({
      type: 'contact',
      subject: `New contact message from ${name}`,
      html: `
        <h2 style="margin:0 0 8px">New contact message</h2>
        <table style="width:100%;font-size:14px;border-top:1px solid #eee;margin-top:12px">
          <tr><td style="padding:6px 0;color:#888">Name</td><td style="padding:6px 0;text-align:right;font-weight:600">${name}</td></tr>
          <tr><td style="padding:6px 0;color:#888">Email</td><td style="padding:6px 0;text-align:right;font-weight:600">${email}</td></tr>
          <tr><td style="padding:6px 0;color:#888">Phone</td><td style="padding:6px 0;text-align:right;font-weight:600">${phone || '—'}</td></tr>
        </table>
        <p style="margin-top:12px;color:#555;white-space:pre-wrap">${message}</p>
      `,
    }),
  ]).catch(() => {})
  await Promise.race([emails, new Promise(res => setTimeout(res, 3000))])
}
