'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function logout() {
    setLoading(true)
    await fetch('/api/customer/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  return (
    <button onClick={logout} disabled={loading} style={{
      width: '100%', padding: '14px', borderRadius: '12px', cursor: loading ? 'wait' : 'pointer',
      background: 'transparent', border: '1px solid #2e2000', color: 'rgba(255,255,255,0.55)',
      fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600,
    }}>
      {loading ? 'Signing out…' : 'Log Out'}
    </button>
  )
}
