'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function StaffLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (res.ok) {
      router.push('/admin')
      router.refresh()
    } else {
      const { error: msg } = await res.json()
      setError(msg || 'Login failed')
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @media (max-width: 640px) {
          .sl-branding { display: none !important; }
          .sl-form-panel { flex: 1 1 100% !important; padding: 40px 24px !important; }
        }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'inherit' }}>

        {/* LEFT — branding panel */}
        <div className="sl-branding" style={{
          flex: '1 1 55%',
          background: 'linear-gradient(135deg, #3d2200 0%, #7d5a0b 35%, #c8940c 60%, #3d2200 100%)',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          padding: '48px 56px', position: 'relative', overflow: 'hidden',
        }}>
          {['-15deg', '-5deg', '5deg', '15deg', '25deg'].map((angle, i) => (
            <div key={i} style={{
              position: 'absolute', top: '-10%', left: `${10 + i * 18}%`,
              width: '1px', height: '80%',
              background: 'linear-gradient(to bottom, rgba(255,251,224,0.18), transparent)',
              transform: `rotate(${angle})`, transformOrigin: 'top center',
              pointerEvents: 'none',
            }} />
          ))}

          <div>
            <img src="/images/logo.png" alt="Khula Cafe" style={{ width: '72px', height: 'auto', display: 'block', filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.4))' }} />
          </div>

          <div>
            <p style={{ fontSize: '11px', letterSpacing: '5px', textTransform: 'uppercase', color: 'rgba(0,0,0,0.5)', marginBottom: '20px' }}>
              Staff Portal
            </p>
            <h1 style={{
              fontFamily: 'var(--font-playfair)',
              fontSize: 'clamp(36px, 4vw, 56px)', fontWeight: 700,
              color: '#0a0600', lineHeight: 1.15, marginBottom: '24px',
            }}>
              Where every<br />great experience<br />is managed.
            </h1>
            <p style={{ fontSize: '15px', color: 'rgba(0,0,0,0.55)', lineHeight: 1.8, maxWidth: '380px' }}>
              Manage your menu, gallery, loyalty programme, and booking options — all in one place.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ height: '1px', width: '40px', background: 'rgba(0,0,0,0.25)' }} />
            <p style={{ fontSize: '11px', letterSpacing: '3px', color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase' }}>
              Khula Cafe · Best of the Best
            </p>
          </div>
        </div>

        {/* RIGHT — login panel */}
        <div className="sl-form-panel" style={{
          flex: '1 1 45%',
          background: '#0a0600',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '48px 56px',
        }}>
          {/* Mobile-only logo */}
          <img src="/images/logo.png" alt="Khula Cafe" style={{
            display: 'none', width: '56px', height: 'auto', marginBottom: '28px',
          }} className="sl-mobile-logo" />

          <div style={{ width: '100%', maxWidth: '360px' }}>
            <h2 style={{
              fontFamily: 'var(--font-playfair)', fontSize: '28px',
              color: '#f5c842', marginBottom: '6px',
            }}>
              Staff Login
            </h2>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginBottom: '40px' }}>
              Sign in to access the admin dashboard.
            </p>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '10px', letterSpacing: '2px', color: '#f5c842', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Email
                </label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  style={{
                    width: '100%', padding: '14px 16px', boxSizing: 'border-box',
                    background: '#1e1500', border: '1px solid #2e2000', borderRadius: '10px',
                    color: '#fafafa', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#f5c842'}
                  onBlur={e => e.target.style.borderColor = '#2e2000'}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10px', letterSpacing: '2px', color: '#f5c842', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Password
                </label>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  style={{
                    width: '100%', padding: '14px 16px', boxSizing: 'border-box',
                    background: '#1e1500', border: '1px solid #2e2000', borderRadius: '10px',
                    color: '#fafafa', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#f5c842'}
                  onBlur={e => e.target.style.borderColor = '#2e2000'}
                />
              </div>

              {error && (
                <p style={{ color: '#ff6b6b', fontSize: '13px', margin: 0, padding: '10px 14px', background: 'rgba(255,107,107,0.08)', borderRadius: '8px', border: '1px solid rgba(255,107,107,0.2)' }}>
                  {error}
                </p>
              )}

              <button type="submit" disabled={loading} style={{
                marginTop: '4px', padding: '15px', borderRadius: '10px', border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                background: loading ? '#2e2000' : 'linear-gradient(135deg, #f5c842, #c8940c)',
                color: loading ? 'rgba(255,255,255,0.4)' : '#0a0600',
                fontWeight: 700, fontSize: '12px', letterSpacing: '2.5px',
                textTransform: 'uppercase', transition: 'all 0.2s',
              }}>
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid #1e1500' }}>
              <Link href="/" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', textDecoration: 'none', letterSpacing: '1px' }}>
                ← Back to site
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .sl-mobile-logo { display: block !important; }
        }
      `}</style>
    </>
  )
}
