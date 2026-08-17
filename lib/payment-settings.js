import 'server-only'
import { supabaseAdmin } from './supabase-admin'

// Loads payment config from the DB, falling back to environment variables for
// any field that isn't set — so existing env-based setups keep working.
export async function getPaymentSettings() {
  let row = null
  try {
    const { data } = await supabaseAdmin
      .from('payment_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
    row = data
  } catch {
    // table missing / unreachable — fall back to env
  }

  return {
    provider: row?.provider || 'paysync',
    fn_base: row?.fn_base || process.env.PAYSTACK_FN_BASE || '',
    credential_id: row?.credential_id || process.env.PAYSTACK_CREDENTIAL_ID || '',
    credential_key: row?.credential_key || process.env.PAYSTACK_CREDENTIAL_KEY || '',
    secret_key: row?.secret_key || process.env.PAYSTACK_SECRET_KEY || '',
    public_key: row?.public_key || process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
    site_url: row?.site_url || process.env.NEXT_PUBLIC_SITE_URL || '',
  }
}
