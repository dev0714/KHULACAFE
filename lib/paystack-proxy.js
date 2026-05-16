const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
}

function requireEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} env var is not set`)
  }
  return value
}

export function getPaystackProxyConfig() {
  const base = requireEnv('PAYSTACK_FN_BASE').replace(/\/$/, '')
  const credentialId = requireEnv('PAYSTACK_CREDENTIAL_ID')
  const credentialKey = requireEnv('PAYSTACK_CREDENTIAL_KEY')

  return {
    base,
    headers: {
      ...DEFAULT_HEADERS,
      'x-credential-id': credentialId,
      'x-credential-key': credentialKey,
    },
  }
}

export async function callPaystackProxy(fnName, action, { query = {}, body = null } = {}) {
  const { base, headers } = getPaystackProxyConfig()
  const url = new URL(`${base}/${fnName}`)
  url.searchParams.set('action', action)

  for (const [key, value] of Object.entries(query)) {
    if (value !== '' && value != null) {
      url.searchParams.set(key, String(value))
    }
  }

  const res = await fetch(url.toString(), {
    method: body ? 'POST' : 'GET',
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: 'no-store',
  })

  const text = await res.text()
  let data
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    throw new Error(`Non-JSON response (${res.status}): ${text.slice(0, 300)}`)
  }

  if (!res.ok) {
    throw new Error(data?.error || data?.message || `Paystack proxy error ${res.status}`)
  }

  return data
}
