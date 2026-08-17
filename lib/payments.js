import 'server-only'
import { getPaymentSettings } from './payment-settings'

const CHANNELS = ['card', 'bank', 'ussd', 'bank_transfer', 'mobile_money']

function normalizeBase(rawBase) {
  const trimmed = (rawBase || '').trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '')
  if (!trimmed) return ''
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

// ── PaySync proxy transport ──
async function proxyCall(s, fnName, action, { query = {}, body = null } = {}) {
  const base = normalizeBase(s.fn_base)
  if (!base) throw new Error('Payment proxy URL is not configured.')
  if (!s.credential_id || !s.credential_key) throw new Error('Payment proxy credentials are not configured.')

  const url = new URL(`${base}/${fnName}`)
  url.searchParams.set('action', action)
  for (const [k, v] of Object.entries(query)) {
    if (v !== '' && v != null) url.searchParams.set(k, String(v))
  }

  const res = await fetch(url.toString(), {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', 'x-credential-id': s.credential_id, 'x-credential-key': s.credential_key },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: 'no-store',
  })
  const text = await res.text()
  let data
  try { data = text ? JSON.parse(text) : null } catch { throw new Error(`Non-JSON response (${res.status}): ${text.slice(0, 300)}`) }
  if (!res.ok) throw new Error(data?.error || data?.message || `Payment proxy error ${res.status}`)
  return data
}

// ── Direct Paystack transport ──
async function directCall(s, path, { method = 'GET', body = null } = {}) {
  if (!s.secret_key) throw new Error('Paystack secret key is not configured.')
  const res = await fetch(`https://api.paystack.co${path}`, {
    method,
    headers: { Authorization: `Bearer ${s.secret_key}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: 'no-store',
  })
  const data = await res.json().catch(() => null)
  if (!res.ok || data?.status === false) throw new Error(data?.message || `Paystack error ${res.status}`)
  return data
}

export async function initializeTransaction({ email, amountCents, reference, metadata, callbackUrl }) {
  const s = await getPaymentSettings()
  const body = { email, amount: amountCents, reference, metadata, callback_url: callbackUrl, currency: 'ZAR', channels: CHANNELS }

  const data = s.provider === 'paystack_direct'
    ? await directCall(s, '/transaction/initialize', { method: 'POST', body })
    : await proxyCall(s, 'paystack-transaction', 'initialize', { body })

  return { authorization_url: data?.data?.authorization_url, reference: data?.data?.reference || reference }
}

export async function verifyTransaction(reference) {
  const s = await getPaymentSettings()
  const data = s.provider === 'paystack_direct'
    ? await directCall(s, `/transaction/verify/${encodeURIComponent(reference)}`, { method: 'GET' })
    : await proxyCall(s, 'paystack-transaction', 'verify', { query: { reference } })

  return { paid: data?.data?.status === 'success' }
}

// A small connectivity test used by the admin "Test connection" button.
export async function testPaymentConnection() {
  const s = await getPaymentSettings()
  try {
    if (s.provider === 'paystack_direct') {
      if (!s.secret_key) return { ok: false, error: 'No Paystack secret key set.' }
      await directCall(s, '/transaction/verify/khula-connection-test', { method: 'GET' })
      return { ok: true, provider: 'Direct Paystack' }
    }
    if (!normalizeBase(s.fn_base) || !s.credential_id || !s.credential_key) {
      return { ok: false, error: 'PaySync proxy URL and credentials are required.' }
    }
    await proxyCall(s, 'paystack-transaction', 'verify', { query: { reference: 'khula-connection-test' } })
    return { ok: true, provider: 'PaySync proxy' }
  } catch (e) {
    // A "transaction not found" style error still means we reached Paystack with
    // valid credentials — treat auth/connection reachability as success.
    const msg = e?.message || String(e)
    if (/not found|invalid reference|transaction reference/i.test(msg)) {
      return { ok: true, provider: s.provider === 'paystack_direct' ? 'Direct Paystack' : 'PaySync proxy', note: 'Reached the payment provider (test reference not found, which is expected).' }
    }
    return { ok: false, error: msg }
  }
}
