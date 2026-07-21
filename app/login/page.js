'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const inputStyle = {
  width: '100%', padding: '14px 18px', borderRadius: '10px',
  background: '#1e1500', border: '1px solid #2e2000', color: '#fafafa',
  fontSize: '14px', outline: 'none', transition: 'border-color 0.2s', fontFamily: 'inherit',
}
const labelStyle = { fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: '#f5c842', display: 'block', marginBottom: '8px' }

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/customer/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Could not log in.'); return }
      router.push('/account')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="page-hero">
        <p className="section-label">Welcome Back</p>
        <h1 style={{ fontFamily: 'var(--font-playfair)' }}>Log In</h1>
        <p>Sign in to view your Khula Bucks and manage your account.</p>
      </div>

      <section style={{ padding: '60px 0 100px', background: '#0a0600' }}>
        <div className="section-wrap" style={{ maxWidth: '440px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Email Address</label>
              <input type="email" required placeholder="your@email.com"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#f5c842'}
                onBlur={e => e.target.style.borderColor = '#2e2000'} />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <input type="password" required placeholder="Your password"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#f5c842'}
                onBlur={e => e.target.style.borderColor = '#2e2000'} />
            </div>

            {error && (
              <p style={{ fontSize: '13px', color: '#f87171', background: 'rgba(248,113,113,0.1)', padding: '12px 16px', borderRadius: '8px', margin: 0 }}>{error}</p>
            )}

            <button type="submit" disabled={loading} style={{
              cursor: loading ? 'wait' : 'pointer', fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase',
              fontWeight: 700, color: '#0a0600', padding: '16px', borderRadius: '50px',
              background: 'linear-gradient(135deg, #f5c842, #c8940c)', border: 'none',
              boxShadow: '0 6px 20px rgba(200,148,12,0.4)', opacity: loading ? 0.7 : 1,
            }}>
              {loading ? 'Signing in…' : 'Log In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
            Don't have an account?{' '}
            <Link href="/register" style={{ color: '#f5c842', textDecoration: 'none', fontWeight: 600 }}>Register</Link>
          </p>
        </div>
      </section>
    </>
  )
}
