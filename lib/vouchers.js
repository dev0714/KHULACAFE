import 'server-only'
import { supabaseAdmin } from './supabase-admin'

export function normalizeCode(code) {
  return (code || '').trim().toUpperCase()
}

function tableMissing(error) {
  return error && (error.code === '42P01' || /vouchers/i.test(error.message || ''))
}

// Preview a voucher without consuming it. Returns { valid, amount_cents } or
// { valid: false, error }.
export async function validateVoucher(code) {
  const clean = normalizeCode(code)
  if (!clean) return { valid: false, error: 'Enter a voucher code.' }

  const { data, error } = await supabaseAdmin
    .from('vouchers')
    .select('code, amount_cents, active, expires_at, redeemed_at')
    .eq('code', clean)
    .maybeSingle()

  if (error) {
    if (tableMissing(error)) return { valid: false, error: 'Vouchers are not available yet.' }
    return { valid: false, error: 'Could not check that voucher.' }
  }
  if (!data) return { valid: false, error: 'Voucher not found.' }
  if (!data.active) return { valid: false, error: 'This voucher is no longer active.' }
  if (data.redeemed_at) return { valid: false, error: 'This voucher has already been used.' }
  if (data.expires_at && new Date(data.expires_at) < new Date(new Date().toDateString())) {
    return { valid: false, error: 'This voucher has expired.' }
  }
  return { valid: true, code: data.code, amount_cents: data.amount_cents }
}

// Atomically consume a voucher. Only succeeds if it is active and unredeemed.
// Returns { amount_cents } on success or { error }.
export async function consumeVoucher(code, note) {
  const clean = normalizeCode(code)
  if (!clean) return { error: 'No voucher code.' }

  const { data, error } = await supabaseAdmin
    .from('vouchers')
    .update({ redeemed_at: new Date().toISOString(), redeemed_note: note || null })
    .eq('code', clean)
    .eq('active', true)
    .is('redeemed_at', null)
    .select('amount_cents')
    .maybeSingle()

  if (error) {
    if (tableMissing(error)) return { error: 'Vouchers are not available yet.' }
    return { error: 'Could not redeem that voucher.' }
  }
  if (!data) return { error: 'Voucher is invalid or already used.' }
  return { amount_cents: data.amount_cents }
}
