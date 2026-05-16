'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '../../lib/cart-context'

const inputStyle = {
  width: '100%', padding: '12px 14px', boxSizing: 'border-box',
  background: '#1e1500', border: '1px solid #2e2000', borderRadius: '8px',
  color: '#fafafa', fontSize: '14px', outline: 'none',
}
const labelStyle = {
  display: 'block', fontSize: '10px', letterSpacing: '2px',
  color: '#f5c842', marginBottom: '6px', textTransform: 'uppercase',
}

export default function CheckoutPage() {
  const { items, totalCents, clearCart } = useCart()
  const router = useRouter()

  const [form, setForm] = useState({ name: '', email: '', phone: '', deliveryType: 'pickup', address: '', notes: '' })
  const [step, setStep] = useState('details') // 'details' | 'payment'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    if (items.length === 0) router.push('/cart')
  }, [items.length, router])

  if (items.length === 0) return null

  async function handleDetailsSubmit(e) {
    e.preventDefault()
    if (form.deliveryType === 'delivery' && !form.address.trim()) {
      setError('Please enter your delivery address.')
      return
    }
    setError('')
    setStep('payment')
  }

  async function handlePaystackCheckout() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: form.name,
          customerEmail: form.email || null,
          customerPhone: form.phone || null,
          deliveryType: form.deliveryType,
          deliveryAddress: form.address || null,
          notes: form.notes || null,
          items,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Order failed')

      if (!form.email?.trim()) {
        clearCart()
        router.push(`/order-confirmed/${data.orderId}`)
        return
      }

      const payRes = await fetch('/api/payments/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: data.orderId,
          email: form.email.trim(),
          amountCents: totalCents,
          customerName: form.name,
        }),
      })
      const payData = await payRes.json()
      if (!payRes.ok) throw new Error(payData.error || 'Failed to initialize payment')

      clearCart()
      window.location.href = payData.authorizationUrl
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#0a0600', minHeight: '100vh', padding: '60px 0' }}>
      <div className="section-wrap" style={{ maxWidth: '640px' }}>
        <Link href="/cart" style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', textDecoration: 'none', letterSpacing: '1px', display: 'block', marginBottom: '32px' }}>
          ← Back to Cart
        </Link>

        <h1 style={{ fontFamily: 'var(--font-playfair)', color: '#fafafa', fontSize: '34px', marginBottom: '32px' }}>Checkout</h1>

        {step === 'details' && (
          <form onSubmit={handleDetailsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Delivery toggle */}
            <div style={{ background: '#1e1500', border: '1px solid #2e2000', borderRadius: '10px', padding: '4px', display: 'flex', gap: '4px' }}>
              {['pickup', 'delivery'].map(type => (
                <button key={type} type="button" onClick={() => set('deliveryType', type)} style={{
                  flex: 1, padding: '10px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                  background: form.deliveryType === type ? 'linear-gradient(135deg, #f5c842, #c8940c)' : 'transparent',
                  color: form.deliveryType === type ? '#0a0600' : 'rgba(255,255,255,0.5)',
                  fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', textTransform: 'uppercase',
                }}>
                  {type === 'pickup' ? '🏠 Pickup' : '🛵 Delivery'}
                </button>
              ))}
            </div>

            <div>
              <label style={labelStyle}>Full Name *</label>
              <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} required
                onFocus={e => e.target.style.borderColor = '#f5c842'}
                onBlur={e => e.target.style.borderColor = '#2e2000'} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Email</label>
                <input style={inputStyle} type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  onFocus={e => e.target.style.borderColor = '#f5c842'}
                  onBlur={e => e.target.style.borderColor = '#2e2000'} />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input style={inputStyle} value={form.phone} onChange={e => set('phone', e.target.value)}
                  onFocus={e => e.target.style.borderColor = '#f5c842'}
                  onBlur={e => e.target.style.borderColor = '#2e2000'} />
              </div>
            </div>

            {form.deliveryType === 'delivery' && (
              <div>
                <label style={labelStyle}>Delivery Address *</label>
                <input style={inputStyle} value={form.address} onChange={e => set('address', e.target.value)} required
                  placeholder="Street, Suburb, City"
                  onFocus={e => e.target.style.borderColor = '#f5c842'}
                  onBlur={e => e.target.style.borderColor = '#2e2000'} />
              </div>
            )}

            <div>
              <label style={labelStyle}>Special Instructions</label>
              <input style={inputStyle} value={form.notes} onChange={e => set('notes', e.target.value)}
                placeholder="Allergies, gate code, etc."
                onFocus={e => e.target.style.borderColor = '#f5c842'}
                onBlur={e => e.target.style.borderColor = '#2e2000'} />
            </div>

            {/* Khula Bucks nudge */}
            <div style={{ background: 'rgba(245,200,66,0.06)', border: '1px solid rgba(245,200,66,0.2)', borderRadius: '10px', padding: '14px 16px', fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
              💛 <strong style={{ color: '#f5c842' }}>Earn Khula Bucks</strong> — Enter your email to automatically earn loyalty points on this order. Already a member? Points are added to your account automatically.
            </div>

            {error && <p style={{ color: '#ff6b6b', fontSize: '13px', margin: 0 }}>{error}</p>}

            <button type="submit" style={{
              padding: '15px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #f5c842, #c8940c)',
              color: '#0a0600', fontWeight: 700, fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase',
            }}>
              Continue to Payment →
            </button>
          </form>
        )}

        {step === 'payment' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Order summary */}
            <div style={{ background: '#1e1500', border: '1px solid #2e2000', borderRadius: '12px', padding: '20px' }}>
              <p style={{ fontSize: '10px', letterSpacing: '3px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '14px' }}>Order Summary</p>
              {items.map(i => (
                <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
                  <span>{i.qty}× {i.name}</span>
                  <span>R{(i.price_cents * i.qty / 100).toFixed(2)}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid #2e2000', paddingTop: '12px', marginTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#fafafa', fontWeight: 700 }}>Total</span>
                <span style={{ color: '#f5c842', fontFamily: 'var(--font-playfair)', fontSize: '20px', fontWeight: 700 }}>R{(totalCents / 100).toFixed(2)}</span>
              </div>
            </div>

            {/* AO Pay placeholder */}
            <div style={{ background: '#1e1500', border: '1px solid #2e2000', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
              <p style={{ fontSize: '10px', letterSpacing: '3px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '16px' }}>Payment</p>
              <div style={{ background: '#140e00', borderRadius: '8px', padding: '20px', marginBottom: '16px' }}>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: 0 }}>
                  🔒 Secure payment via Paystack
                </p>
                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', marginTop: '8px' }}>
                  You will be redirected to Paystack to complete secure payment. If you skip payment, your order remains pending.
                </p>
              </div>

              {error && <p style={{ color: '#ff6b6b', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}

              <button onClick={handlePaystackCheckout} disabled={loading} style={{
                width: '100%', padding: '15px', borderRadius: '10px', border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                background: loading ? '#2e2000' : 'linear-gradient(135deg, #f5c842, #c8940c)',
                color: loading ? 'rgba(255,255,255,0.4)' : '#0a0600',
                fontWeight: 700, fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase',
              }}>
                {loading ? 'Redirecting…' : `Pay with Paystack — R${(totalCents / 100).toFixed(2)}`}
              </button>
            </div>

            <button onClick={() => setStep('details')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: '12px', cursor: 'pointer', letterSpacing: '1px' }}>
              ← Edit Details
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
