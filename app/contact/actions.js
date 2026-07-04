'use server'
import { supabaseAdmin } from '../../lib/supabase-admin'
import { sendContactConfirmation } from '../../lib/resend'

export async function submitContactMessage({ name, email, phone, message }) {
  const { error } = await supabaseAdmin
    .from('contact_messages')
    .insert({ name, email: email.trim().toLowerCase(), phone: phone || null, message })

  if (error) {
    console.error('contact_messages insert error:', error)
    throw new Error('Failed to save message. Please try again.')
  }

  // Fire-and-forget confirmation email — don't block if it fails
  try {
    await sendContactConfirmation({ name, email })
  } catch (e) {
    console.error('contact confirmation email failed:', e)
  }
}
