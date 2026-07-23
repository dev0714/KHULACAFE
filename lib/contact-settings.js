import 'server-only'
import { supabaseAdmin } from './supabase-admin'
import { DEFAULT_CONTACT } from './contact-links'

// Loads the single-row contact settings, falling back to sensible defaults for
// any missing table/row/field.
export async function getContactSettings() {
  const { data } = await supabaseAdmin
    .from('contact_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle()

  if (!data) return { ...DEFAULT_CONTACT }

  const hours = Array.isArray(data.trading_hours) && data.trading_hours.length
    ? data.trading_hours
    : DEFAULT_CONTACT.trading_hours

  return {
    address: data.address ?? DEFAULT_CONTACT.address,
    phone: data.phone ?? DEFAULT_CONTACT.phone,
    email: data.email ?? DEFAULT_CONTACT.email,
    whatsapp: data.whatsapp ?? DEFAULT_CONTACT.whatsapp,
    trading_hours: hours,
    instagram: data.instagram ?? '',
    tiktok: data.tiktok ?? '',
    facebook: data.facebook ?? '',
  }
}
