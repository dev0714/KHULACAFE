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

  // Confirm to the customer + notify staff — never block the submission on email.
  try {
    await sendContactConfirmation({ name, email })
    await notifyStaff({
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
    })
  } catch (e) {
    console.error('contact email failed:', e)
  }
}
