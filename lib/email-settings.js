import 'server-only'
import { supabaseAdmin } from './supabase-admin'

// Loads the single-row email configuration. Returns { row, tableMissing }.
// `row` is null when the table exists but has no row yet, or when the table
// is missing entirely (in which case tableMissing is true).
export async function getEmailSettings() {
  const { data, error } = await supabaseAdmin
    .from('email_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle()

  if (error) {
    const tableMissing = error.code === '42P01' || /email_settings/i.test(error.message || '')
    return { row: null, tableMissing }
  }
  return { row: data, tableMissing: false }
}
