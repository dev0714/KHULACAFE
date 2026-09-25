'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '../../lib/cart-context'
import { validateVoucherPublic } from '../admin/actions'
import { slotsFor, ASAP } from '../../lib/trading-hours'

const inputStyle = {
  width: '100%', padding: '12px 14px', boxSizing: 'border-box',
  background: '#1e1500', border: '1px solid #2e2000', borderRadius: '8px',
  color: '#fafafa', fontSize: '14px', outline: 'none',
}
const labelStyle = {
  display: 'block', fontSize: '10px', letterSpacing: '2px',
  color: '#f5c842', marginBottom: '6px', textTransform: 'uppercase',
}

const timeChipStyle = (active) => ({
  cursor: 'pointer', padding: '9px 14px', borderRadius: '20px',
  fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px',
  background: active ? 'linear-gradient(135deg, #f5c842, #c8940c)' : '#1e1500',
  color: active ? '#0a0600' : 'rgba(255,255,255,0.6)',
  border: `1px solid ${active ? 'transparent' : '#2e2000'}`,
  transition: 'all 0.15s', whiteSpace: 'nowrap',
})

export default function CheckoutPage() {
  const { items, totalCents, clearCart } = useCart()
  const router = useRouter()

  const [form, setForm] = useState({ name: '', email: '', phone: '', deliveryType: 'pickup', address: '', wantedTime: '', notes: '' })
  const [step, setStep] = useState('details') // 'details' | 'payment'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Khula Bucks state
  const [loyaltyCustomer, setLoyaltyCustomer] = useState(null) // { customerId, name, khulaBucks }
  const [useBucks, setUseBucks] = useState(false)
  const [bucksToUse, setBucksToUse] = useState(0)

  // Voucher
  const [voucherCode, setVoucherCode] = useState('')
  const [voucherApplied, setVoucherApplied] = useState(null) // { code, amount_cents }
  const [voucherError, setVoucherError] = useState('')
  const [voucherChecking, setVoucherChecking] = useState(false)

  async function applyVoucher(code = voucherCode, { quiet = false } = {}) {
    setVoucherError('')
    const clean = (code || '').trim()
    if (!clean) return null
    setVoucherChecking(true)
    try {
      const res = await validateVoucherPublic(clean)
      if (res.valid) setVoucherApplied({ code: res.code, amount_cents: res.amount_cents })
      else { setVoucherApplied(null); if (!quiet || clean.length >= 6) setVoucherError(res.error || 'Invalid voucher.') }
      return res
    } catch {
      setVoucherError('Could not check that voucher.')
      return { valid: false, error: 'Could not check that voucher.' }
    } finally { setVoucherChecking(false) }
  }


  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Apply a voucher by itself once typing pauses, so a code is never left in
  // the box un-applied while the customer is sent to pay the full amount.
  useEffect(() => {
    if (voucherApplied || voucherCode.trim().length < 4) return
    const t = setTimeout(() => applyVoucher(voucherCode, { quiet: true }), 800)
    return () => clearTimeout(t)
  }, [voucherCode]) // eslint-disable-line react-hooks/exhaustive-deps

  // Slots depend on today's hours and on pickup vs delivery; recheck each minute.
  const [tick, setTick] = useState(0)
  useEffect(() => { const t = setInterval(() => setTick(n => n + 1), 60000); return () => clearInterval(t) }, [])
  const slotInfo = slotsFor(form.deliveryType)
  // Drop a chosen time that is no longer allowed (switched to delivery, or time passed).
  useEffect(() => {
    if (!form.wantedTime) return
    const ok = form.wantedTime === ASAP ? slotInfo.asap : slotInfo.slots.includes(form.wantedTime)
    if (!ok) setForm(f => ({ ...f, wantedTime: '' }))
  }, [form.deliveryType, tick]) // eslint-disable-line react-hooks/exhaustive-deps

  // An empty cart means there is nothing to check out, unless the cart is
  // empty because an order was just placed and we are on our way out.
  const leavingRef = useRef(false)
  useEffect(() => {
    if (items.length === 0 && !leavingRef.current) router.push('/cart')
  }, [items.length, router])

  // Remember the customer's details on this device so a second order, or a
  // return trip to the menu mid-order, never means typing the address again.
  const SAVED_KEY = 'khula_checkout_details'
  const [restored, setRestored] = useState(false)
  const [prefilled, setPrefilled] = useState(false)
  useEffect(() => {
    let saved = null
    try { saved = JSON.parse(localStorage.getItem(SAVED_KEY) || 'null') } catch {}
    if (saved) {
      setForm(f => ({
        ...f,
        name: saved.name || f.name,
        email: saved.email || f.email,
        phone: saved.phone || f.phone,
        deliveryType: saved.deliveryType === 'delivery' ? 'delivery' : f.deliveryType,
        address: saved.address || f.address,
      }))
      if (saved.address || saved.name) setPrefilled(true)
    }
    // A signed-in customer's account fills anything still blank, so their
    // saved address follows them to a new phone or laptop too.
    fetch('/api/customer/me')
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated) return
        setForm(f => ({
          ...f,
          name: f.name || d.name || '',
          email: f.email || d.email || '',
          phone: f.phone || d.phone || '',
          address: f.address || d.deliveryAddress || '',
          deliveryType: saved?.deliveryType ? f.deliveryType : (d.deliveryType === 'delivery' ? 'delivery' : f.deliveryType),
        }))
        if (d.deliveryAddress) setPrefilled(true)
      })
      .catch(() => {})
      .finally(() => setRestored(true))
  }, [])

  // Save as they type (only once the saved copy has been loaded, so an
  // empty first render never wipes it).
  useEffect(() => {
    if (!restored) return
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify({
        name: form.name, email: form.email, phone: form.phone,
        deliveryType: form.deliveryType, address: form.address,
      }))
    } catch {}
  }, [restored, form.name, form.email, form.phone, form.deliveryType, form.address])

  if (items.length === 0) return null

  async function handleDetailsSubmit(e) {
    e.preventDefault()
    if (form.deliveryType === 'delivery' && !form.address.trim()) {
      setError('Please enter your delivery address.')
      return
    }
    if (!form.wantedTime) {
      setError(form.deliveryType === 'delivery'
        ? 'Please choose what time you would like your order delivered.'
        : 'Please choose what time you will collect your order.')
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
  const voucherCents = voucherApplied ? Math.min(voucherApplied.amount_cents, Math.max(0, totalCents - redeemedCents)) : 0
  const payableCents = Math.max(0, totalCents - redeemedCents - voucherCents)

  async function handlePaystackCheckout() {
    setError('')
    if (!voucherApplied && voucherCode.trim()) {
      const res = await applyVoucher(voucherCode)
      if (!res?.valid) {
        setError(`Voucher ${voucherCode.trim()}: ${res?.error || 'could not be applied.'} Remove it to pay by card instead.`)
        return
      }
      setError('')
      return // applied: let the customer see the new amount before paying
    }
    setLoading(true)
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
          wantedTime: form.wantedTime || null,
          notes: form.notes || null,
          items,
          bucksRedeemed: redeemedBucks,
          customerId: loyaltyCustomer?.customerId || null,
          voucherCode: voucherApplied?.code || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Order failed')

      // Use the server's authoritative net (after bucks + voucher) for payment
      const payNow = typeof data.netCents === 'number' ? data.netCents : payableCents

      // If fully covered by bucks/voucher, or no email, skip Paystack
      if (payNow === 0 || !form.email?.trim()) {
        leavingRef.current = true
        router.push(`/order-confirmed/${data.orderId}`)
        clearCart()
        return
      }

      const payRes = await fetch('/api/payments/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: data.orderId,
          email: form.email.trim(),
          amountCents: payNow,
          customerName: form.name,
        }),
      })
      const payData = await payRes.json()
      if (!payRes.ok) throw new Error(payData.error || 'Failed to initialize payment')

      leavingRef.current = true
      clearCart()
      window.location.href = payData.authorizationUrl
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#0a0600', minHeight: '100vh', padding: '130px 0 60px' }}>
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

            {/* When do they want it */}
            <div>
              <label style={labelStyle}>
                {form.deliveryType === 'delivery' ? 'Delivery Time *' : 'Collection Time *'}
              </label>
              {slotInfo.slots.length === 0 && !slotInfo.asap ? (
                <p style={{ fontSize: '13px', color: '#ff8a7a', margin: 0, lineHeight: 1.6 }}>
                  {slotInfo.open
                    ? `We are no longer taking ${form.deliveryType === 'delivery' ? 'deliveries' : 'collections'} today. Please order again tomorrow.`
                    : 'We are closed today (Sundays and Mondays). Please order again on Tuesday.'}
                </p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {slotInfo.asap && (
                    <button type="button" onClick={() => set('wantedTime', ASAP)} style={timeChipStyle(form.wantedTime === ASAP)}>
                      As soon as possible
                    </button>
                  )}
                  {slotInfo.slots.map(t => (
                    <button key={t} type="button" onClick={() => set('wantedTime', t)} style={timeChipStyle(form.wantedTime === t)}>
                      {t}
                    </button>
                  ))}
                </div>
              )}
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', margin: '8px 0 0' }}>
                {form.deliveryType === 'delivery'
                  ? `Deliveries run until 30 minutes before closing${slotInfo.last ? `, so the last delivery today is ${slotInfo.last}` : ''}.`
                  : `Collect any time until we close${slotInfo.close ? ` at ${slotInfo.close} today` : ''}.`}
              </p>
            </div>

            <div>
              <label style={labelStyle}>Full Name *</label>
              <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} required autoComplete="name"
                onFocus={e => e.target.style.borderColor = '#f5c842'}
                onBlur={e => e.target.style.borderColor = '#2e2000'} />
            </div>

            <div className="checkout-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Email</label>
                <input style={inputStyle} type="email" autoComplete="email" value={form.email} onChange={e => set('email', e.target.value)}
                  onFocus={e => e.target.style.borderColor = '#f5c842'}
                  onBlur={e => e.target.style.borderColor = '#2e2000'} />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input style={inputStyle} type="tel" autoComplete="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                  onFocus={e => e.target.style.borderColor = '#f5c842'}
                  onBlur={e => e.target.style.borderColor = '#2e2000'} />
              </div>
            </div>

            {form.deliveryType === 'delivery' && (
              <div>
                <label style={labelStyle}>Delivery Address *</label>
                <input style={inputStyle} value={form.address} onChange={e => set('address', e.target.value)} required
                  placeholder="Street, Suburb, City"
                  autoComplete="street-address"
                  onFocus={e => e.target.style.borderColor = '#f5c842'}
                  onBlur={e => e.target.style.borderColor = '#2e2000'} />
                {prefilled && form.address && (
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '6px 0 0' }}>
                    Filled in from your last order. Change it if we're delivering somewhere else.
                  </p>
                )}
              </div>
            )}

            <div>
              <label style={labelStyle}>Special Instructions</label>
              <textarea
                style={{ ...inputStyle, minHeight: '96px', resize: 'vertical', lineHeight: 1.6, fontFamily: 'inherit' }}
                value={form.notes}
                maxLength={500}
                onChange={e => set('notes', e.target.value)}
                placeholder={form.deliveryType === 'delivery'
                  ? 'Allergies, no onions, extra sauce, gate code, where to leave it…'
                  : 'Allergies, no onions, extra sauce, how you would like it cooked…'}
                onFocus={e => e.target.style.borderColor = '#f5c842'}
                onBlur={e => e.target.style.borderColor = '#2e2000'} />
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginTop: '6px' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                  Anything the kitchen should know. This goes straight to our team.
                </span>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>{form.notes.length}/500</span>
              </div>
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
              {voucherCents > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#26de81', marginTop: '6px' }}>
                  <span>🎟️ Voucher {voucherApplied.code}</span>
                  <span>−R{(voucherCents / 100).toFixed(2)}</span>
                </div>
              )}
              {redeemedBucks > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#26de81', marginTop: '6px' }}>
                  <span>🎁 Khula Bucks ({redeemedBucks} bucks)</span>
                  <span>−R{(redeemedCents / 100).toFixed(2)}</span>
                </div>
              )}
              <div style={{ borderTop: '1px solid #2e2000', paddingTop: '12px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#fafafa', fontWeight: 700 }}>
                  {(redeemedBucks > 0 || voucherCents > 0) ? 'You Pay' : 'Total'}
                </span>
                <div style={{ textAlign: 'right' }}>
                  {(redeemedBucks > 0 || voucherCents > 0) && (
                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', textDecoration: 'line-through' }}>R{(totalCents / 100).toFixed(2)}</div>
                  )}
                  <span style={{ color: '#f5c842', fontFamily: 'var(--font-playfair)', fontSize: '20px', fontWeight: 700 }}>
                    R{(payableCents / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Voucher */}
            <div style={{ background: '#1e1500', border: '1px solid #2e2000', borderRadius: '12px', padding: '16px 20px' }}>
              <p style={{ fontSize: '10px', letterSpacing: '3px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '12px' }}>Voucher</p>
              {voucherApplied ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <span style={{ fontSize: '13px', color: '#26de81' }}>🎟️ <strong>{voucherApplied.code}</strong> applied — R{(voucherApplied.amount_cents / 100).toFixed(2)}</span>
                  <button type="button" onClick={() => { setVoucherApplied(null); setVoucherCode(''); setVoucherError('') }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '13px' }}>Remove</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" placeholder="Voucher code" value={voucherCode}
                    onChange={e => { setVoucherCode(e.target.value.toUpperCase()); setVoucherError('') }}
                    style={{ ...inputStyle, flex: 1 }} />
                  <button type="button" onClick={() => applyVoucher()} disabled={voucherChecking || !voucherCode.trim()} style={{
                    padding: '0 20px', borderRadius: '8px', border: '1px solid #2e2000', cursor: 'pointer',
                    background: '#0a0600', color: '#f5c842', fontWeight: 700, fontSize: '12px', whiteSpace: 'nowrap',
                  }}>{voucherChecking ? '…' : 'Apply'}</button>
                </div>
              )}
              {voucherError && <p style={{ fontSize: '12px', color: '#ff6b6b', margin: '8px 0 0' }}>{voucherError}</p>}
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
                {payableCents === 0 ? (
                  <>
                    <p style={{ color: '#26de81', fontSize: '14px', fontWeight: 600, margin: 0 }}>
                      Nothing to pay by card
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', marginTop: '8px', lineHeight: 1.6 }}>
                      Your {voucherCents > 0 && redeemedBucks > 0 ? 'voucher and Khula Bucks cover' : voucherCents > 0 ? 'voucher covers' : 'Khula Bucks cover'} the full amount.
                      Place your order and you're done.
                    </p>
                  </>
                ) : (
                  <>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: 0 }}>
                      🔒 Secure payment via Paystack
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', marginTop: '8px', lineHeight: 1.6 }}>
                      {voucherCents > 0 || redeemedBucks > 0
                        ? `R${((voucherCents + redeemedCents) / 100).toFixed(2)} is covered. The remaining R${(payableCents / 100).toFixed(2)} is paid by card on Paystack, then you come straight back to Khula Cafe.`
                        : 'You pay by card on Paystack, then come straight back to Khula Cafe.'}
                    </p>
                  </>
                )}
                {!voucherApplied && voucherCode.trim() && (
                  <p style={{ color: '#ff9f43', fontSize: '12px', marginTop: '10px' }}>
                    {voucherChecking ? 'Checking your voucher…' : `Voucher ${voucherCode.trim()} is not applied yet.`}
                  </p>
                )}
              </div>

              {error && <p style={{ color: '#ff6b6b', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}

              <button onClick={handlePaystackCheckout} disabled={loading} style={{
                width: '100%', padding: '15px', borderRadius: '10px', border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                background: loading ? '#2e2000' : 'linear-gradient(135deg, #f5c842, #c8940c)',
                color: loading ? 'rgba(255,255,255,0.4)' : '#0a0600',
                fontWeight: 700, fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase',
              }}>
                {loading ? 'Placing order…'
                  : !voucherApplied && voucherCode.trim() ? 'Apply voucher'
                  : payableCents === 0 ? `✓ Place order — paid by ${voucherCents > 0 ? 'voucher' : 'Khula Bucks'}`
                  : `Pay R${(payableCents / 100).toFixed(2)} by card`}
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
