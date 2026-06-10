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

  // Khula Bucks state
  const [loyaltyCustomer, setLoyaltyCustomer] = useState(null) // { customerId, name, khulaBucks }
  const [useBucks, setUseBucks] = useState(false)
  const [bucksToUse, setBucksToUse] = useState(0)

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
    // Look up Khula Bucks balance by email
    setLoyaltyCustomer(null)
    setUseBucks(false)
    setBucksToUse(0)
    if (form.email?.trim()) {
      try {
        const res = await fetch(`/api/loyalty/lookup?email=${encodeURIComponent(form.email.trim())}`)
        const data = await res.json()
        if (data.found && data.khulaBucks > 0) setLoyaltyCustomer(data)
      } catch {}
    }
    setStep('payment')
  }

  const redeemedBucks = useBucks ? bucksToUse : 0
  const redeemedCents = redeemedBucks * 100
  const payableCents = Math.max(0, totalCents - redeemedCents)

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
          bucksRedeemed: redeemedBucks,
          customerId: loyaltyCustomer?.customerId || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Order failed')

      // If fully paid with bucks, skip Paystack
      if (payableCents === 0) {
        clearCart()
        router.push(`/order-confirmed/${data.orderId}`)
        return
      }

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
          amountCents: payableCents,
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

            <div className="checkout-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
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
              {redeemedBucks > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#26de81', marginTop: '6px' }}>
                  <span>🎁 Khula Bucks ({redeemedBucks} bucks)</span>
                  <span>−R{(redeemedCents / 100).toFixed(2)}</span>
                </div>
              )}
              <div style={{ borderTop: '1px solid #2e2000', paddingTop: '12px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#fafafa', fontWeight: 700 }}>
                  {redeemedBucks > 0 ? 'You Pay' : 'Total'}
                </span>
                <div style={{ textAlign: 'right' }}>
                  {redeemedBucks > 0 && (
                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', textDecoration: 'line-through' }}>R{(totalCents / 100).toFixed(2)}</div>
                  )}
                  <span style={{ color: '#f5c842', fontFamily: 'var(--font-playfair)', fontSize: '20px', fontWeight: 700 }}>
                    R{(payableCents / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Khula Bucks panel */}
            {loyaltyCustomer && (
              <div style={{ border: `1px solid ${useBucks ? 'rgba(245,200,66,0.5)' : 'rgba(245,200,66,0.2)'}`, borderRadius: '12px', padding: '20px', background: useBucks ? 'rgba(245,200,66,0.06)' : '#1e1500', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: useBucks ? '18px' : '0' }}>
                  <div>
                    <p style={{ color: '#f5c842', fontWeight: 700, fontSize: '14px', margin: '0 0 2px' }}>
                      💛 {loyaltyCustomer.khulaBucks} Khula Bucks available
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>
                      Worth R{loyaltyCustomer.khulaBucks.toFixed(2)} off your order
                    </p>
                  </div>
                  {/* Toggle */}
                  <button
                    type="button"
                    onClick={() => { setUseBucks(u => !u); setBucksToUse(u => u ? 0 : Math.min(loyaltyCustomer.khulaBucks, Math.floor(totalCents / 100))) }}
                    style={{
                      width: '48px', height: '26px', borderRadius: '13px', border: 'none', cursor: 'pointer', flexShrink: 0,
                      background: useBucks ? 'linear-gradient(135deg, #f5c842, #c8940c)' : '#2e2000',
                      position: 'relative', transition: 'background 0.2s',
                    }}
                  >
                    <span style={{
                      position: 'absolute', top: '3px', width: '20px', height: '20px', borderRadius: '50%',
                      background: '#fafafa', transition: 'left 0.2s',
                      left: useBucks ? '25px' : '3px',
                    }} />
                  </button>
                </div>

                {useBucks && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', textTransform: 'uppercase' }}>Bucks to use</span>
                      <span style={{ fontSize: '13px', color: '#f5c842', fontWeight: 700 }}>{bucksToUse} bucks = R{bucksToUse.toFixed(2)} off</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={Math.min(loyaltyCustomer.khulaBucks, Math.floor(totalCents / 100))}
                      step={1}
                      value={bucksToUse}
                      onChange={e => setBucksToUse(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#f5c842', cursor: 'pointer' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Save all</span>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Use all ({Math.min(loyaltyCustomer.khulaBucks, Math.floor(totalCents / 100))} bucks)</span>
                    </div>
                    {payableCents === 0 && (
                      <p style={{ marginTop: '12px', fontSize: '13px', color: '#26de81', textAlign: 'center', fontWeight: 600 }}>
                        🎉 Your order is fully covered by Khula Bucks!
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

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
                {loading ? 'Redirecting…' : payableCents === 0 ? '✓ Place Order — Fully Paid with Bucks' : `Pay with Paystack — R${(payableCents / 100).toFixed(2)}`}
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
