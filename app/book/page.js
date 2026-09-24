'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase-public'
import { createBooking, validateVoucherPublic } from '../admin/actions'

// The cafe is closed on Sundays (0) and Mondays (1).
const CLOSED_DAYS = [0, 1]
const CLOSED_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
// The next eight days we are actually open, offered as one-tap choices.
const NEXT_OPEN_DATES = (() => {
  const out = []
  const d = new Date()
  while (out.length < 8) {
    d.setDate(d.getDate() + 1)
    if (CLOSED_DAYS.includes(d.getDay())) continue
    out.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' }),
    })
  }
  return out
})()

function isClosedDay(dateStr) {
  if (!dateStr) return false
  const d = new Date(dateStr + 'T00:00:00')
  return !Number.isNaN(d.getTime()) && CLOSED_DAYS.includes(d.getDay())
}

export default function BookPage() {
  const [occasions, setOccasions] = useState([])
  const [addOns, setAddOns] = useState([])

  useEffect(() => {
    Promise.all([
      supabase.from('booking_occasions').select('*').order('sort_order'),
      supabase.from('booking_addons').select('*').order('sort_order'),
    ]).then(([{ data: occs }, { data: addons }]) => {
      if (occs) setOccasions(occs)
      if (addons) setAddOns(addons.map(a => ({ ...a, price: a.price_cents / 100 })))
    })
  }, [])

  // If the customer is logged in, pre-fill their details and load their Khula
  // Bucks automatically so a returning member sees their balance without retyping.
  useEffect(() => {
    fetch('/api/customer/me')
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated) return
        setForm(f => ({
          ...f,
          name: f.name || d.name || '',
          email: f.email || d.email || '',
          phone: f.phone || d.phone || '',
        }))
        if (d.khulaBucks > 0) setLoyalty({ customerId: d.id, khulaBucks: d.khulaBucks })
      })
      .catch(() => {})
  }, [])

  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    occasion: '',
    date: '',
    time: '',
    guests: 2,
    name: '',
    email: '',
    phone: '',
    selectedAddOns: [],
    specialRequest: '',
    specialSong: '',
    occasionReason: '',
  })
  // Custom rand amounts per add-on (e.g. Gift Card — the customer sets the value)
  const [addonAmounts, setAddonAmounts] = useState({})
  const [addonColors, setAddonColors] = useState({}) // addon id → chosen colour
  const [lightbox, setLightbox] = useState(null) // full-screen image url
  // Payment: voucher + Khula Bucks toward the deposit
  const [voucherCode, setVoucherCode] = useState('')
  const [voucherApplied, setVoucherApplied] = useState(null) // { code, amount_cents }
  const [voucherError, setVoucherError] = useState('')
  const [voucherChecking, setVoucherChecking] = useState(false)
  const [loyalty, setLoyalty] = useState(null) // { customerId, khulaBucks }
  const [useBucks, setUseBucks] = useState(false)
  const [bucksToUse, setBucksToUse] = useState(0)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [bookingRef, setBookingRef] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [submitNotice, setSubmitNotice] = useState('')

  // Scroll to the top of the page whenever the step changes, so the customer
  // lands on the new section instead of staying scrolled at the bottom.
  useEffect(() => {
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step])

  const isCustomAmount = (a) => /gift\s*card/i.test(a?.label || '')
  const addonPrice = (a) => {
    if (isCustomAmount(a)) {
      const v = parseFloat(addonAmounts[a.id])
      return Number.isFinite(v) && v > 0 ? v : 0
    }
    return a.price
  }

  const toggleAddOn = (id) => {
    setForm(f => ({
      ...f,
      selectedAddOns: f.selectedAddOns.includes(id)
        ? f.selectedAddOns.filter(a => a !== id)
        : [...f.selectedAddOns, id],
    }))
  }

  const totalAddOns = form.selectedAddOns.reduce((sum, id) => {
    const a = addOns.find(a => a.id === id)
    return sum + (a ? addonPrice(a) : 0)
  }, 0)

  const selectedOccasion = occasions.find(o => o.id === form.occasion)
  const depositCents = selectedOccasion?.price_cents ?? 10000
  const totalOwing = (depositCents / 100) + totalAddOns

  // Deposit payment breakdown (voucher + Khula Bucks, 1 Buck = R1)
  const depositRands = depositCents / 100
  const voucherRands = voucherApplied ? Math.min(voucherApplied.amount_cents / 100, depositRands) : 0
  const afterVoucher = Math.max(0, depositRands - voucherRands)
  const bucksRands = useBucks && loyalty ? Math.min(bucksToUse, afterVoucher, loyalty.khulaBucks) : 0
  const depositDue = Math.max(0, afterVoucher - bucksRands)

  async function applyVoucher(code = voucherCode, { quiet = false } = {}) {
    setVoucherError('')
    const clean = (code || '').trim()
    if (!clean) return null
    setVoucherChecking(true)
    try {
      const res = await validateVoucherPublic(clean)
      if (res.valid) { setVoucherApplied({ code: res.code, amount_cents: res.amount_cents }); setVoucherError('') }
      else { setVoucherApplied(null); if (!quiet || clean.length >= 6) setVoucherError(res.error || 'Invalid voucher.') }
      return res
    } catch {
      setVoucherError('Could not check that voucher.')
      return { valid: false, error: 'Could not check that voucher.' }
    } finally { setVoucherChecking(false) }
  }
  // Apply the code by itself once the customer stops typing, so a voucher
  // is never left sitting in the box un-applied.
  useEffect(() => {
    if (voucherApplied || voucherCode.trim().length < 4) return
    const t = setTimeout(() => applyVoucher(voucherCode, { quiet: true }), 800)
    return () => clearTimeout(t)
  }, [voucherCode]) // eslint-disable-line react-hooks/exhaustive-deps
  function removeVoucher() { setVoucherApplied(null); setVoucherCode(''); setVoucherError('') }

  async function lookupBucks(email) {
    if (!email?.trim()) { setLoyalty(null); setUseBucks(false); setBucksToUse(0); return }
    try {
      const res = await fetch(`/api/loyalty/lookup?email=${encodeURIComponent(email.trim())}`)
      const data = await res.json()
      if (data.found && data.khulaBucks > 0) setLoyalty({ customerId: data.customerId, khulaBucks: data.khulaBucks })
      else { setLoyalty(null); setUseBucks(false); setBucksToUse(0) }
    } catch { setLoyalty(null) }
  }

  const ROMANTIC_REASONS = ['Proposal', 'Engagement', 'Anniversary', 'Date Night', "Valentine's Day", 'Birthday Surprise', 'Just Because']
  const needsReason = /romantic/i.test(selectedOccasion?.label || '') || selectedOccasion?.category === 'Romantic'
  const step1Ready = !!form.occasion && (!needsReason || !!form.occasionReason)

  // When a Romantic occasion is picked, bring the (newly shown) reason dropdown
  // into view so the customer sees the next step instead of a no-op click.
  const reasonRef = useRef(null)
  useEffect(() => {
    if (needsReason && !form.occasionReason && reasonRef.current) {
      reasonRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [form.occasion, needsReason])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')
    setSubmitNotice('')
    // A code typed but not yet applied: apply it now and let the customer see
    // the new amount due before anything is charged.
    if (!voucherApplied && voucherCode.trim()) {
      const res = await applyVoucher(voucherCode)
      if (!res?.valid) { setSubmitError(`Voucher ${voucherCode.trim()}: ${res?.error || 'could not be applied.'} Remove it or try another code.`); return }
      setSubmitNotice('Your voucher has been applied. Check the new amount due above, then confirm again.')
      return
    }
    const giftNoAmount = addOns.find(a => form.selectedAddOns.includes(a.id) && isCustomAmount(a) && !(addonPrice(a) > 0))
    if (giftNoAmount) { setSubmitError(`Please enter an amount for ${giftNoAmount.label}, or untick it.`); return }
    // Require a colour for any selected add-on that offers colour options
    const missingColor = addOns.find(a =>
      form.selectedAddOns.includes(a.id) && Array.isArray(a.colors) && a.colors.length > 0 && !addonColors[a.id])
    if (missingColor) {
      setSubmitError(`Please choose a colour for ${missingColor.label}.`)
      return
    }
    setLoading(true)
    try {
      const selectedAddOns = addOns
        .filter(a => form.selectedAddOns.includes(a.id))
        .map(a => ({ id: a.id, label: a.label, icon: a.icon, price_cents: Math.round(addonPrice(a) * 100), color: addonColors[a.id] || null }))
      const result = await createBooking({
        occasion_id: form.occasion || null,
        date: form.date,
        time: form.time,
        guests: form.guests,
        customer_name: form.name,
        customer_email: form.email || null,
        customer_phone: form.phone || null,
        add_ons: selectedAddOns,
        special_song: form.specialSong || null,
        special_request: form.specialRequest || null,
        occasion_reason: form.occasionReason || null,
        deposit_cents: depositCents,
        voucher_code: voucherApplied?.code || null,
        bucks_redeemed: bucksRands,
        customer_id: loyalty?.customerId || null,
      })
      setBookingRef(result.reference)
      setSuccess(true)
    } catch (err) {
      setSubmitError(err.message || 'Booking failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '14px 18px', borderRadius: '10px',
    background: '#1e1500', border: '1px solid #2e2000', color: '#fafafa',
    fontSize: '14px', outline: 'none', transition: 'border-color 0.2s',
    fontFamily: 'inherit',
  }

  const labelStyle = {
    fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase',
    color: '#f5c842', display: 'block', marginBottom: '8px',
  }

  if (success) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(105deg, #7d5a0b 0%, #c8940c 18%, #f5c842 38%, #fffbe0 52%, #f5c842 66%, #c8940c 82%, #7d5a0b 100%)',
        padding: '120px 24px 60px', textAlign: 'center',
      }}>
        <div style={{ maxWidth: '520px' }}>
          <div style={{ fontSize: '72px', marginBottom: '24px' }}>🎉</div>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(28px,5vw,48px)', fontWeight: 700, color: '#0a0600', marginBottom: '16px' }}>
            You're All Set!
          </h1>
          <p style={{ fontSize: '15px', color: 'rgba(0,0,0,0.65)', lineHeight: 1.8, marginBottom: '12px' }}>
            Thank you, <strong style={{ color: '#0a0600' }}>{form.name}</strong>! Your table for{' '}
            <strong style={{ color: '#3d2200' }}>{form.guests} guests</strong> is reserved for{' '}
            <strong style={{ color: '#3d2200' }}>{form.date}</strong> at{' '}
            <strong style={{ color: '#3d2200' }}>{form.time}</strong>.
          </p>
          <p style={{ fontSize: '13px', color: 'rgba(0,0,0,0.45)', lineHeight: 1.7, marginBottom: '40px' }}>
            A confirmation will be sent to {form.email}. Your R{(depositCents / 100).toFixed(0)} deposit will be deducted from your final bill.
          </p>
          <div style={{ background: 'rgba(0,0,0,0.12)', border: '1px solid rgba(61,34,0,0.3)', borderRadius: '12px', padding: '20px', marginBottom: '40px' }}>
            <p style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: '#3d2200', marginBottom: '8px' }}>
              Your Booking Reference
            </p>
            <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '28px', color: '#0a0600', letterSpacing: '4px' }}>
              {bookingRef || '—'}
            </p>
          </div>
          <button onClick={() => { setSuccess(false); setStep(1); setAddonAmounts({}); setAddonColors({}); setVoucherApplied(null); setVoucherCode(''); setVoucherError(''); setLoyalty(null); setUseBucks(false); setBucksToUse(0); setForm({ occasion:'', date:'', time:'', guests:2, name:'', email:'', phone:'', selectedAddOns:[], specialRequest:'', specialSong:'', occasionReason:'' }) }}
            style={{
              cursor: 'pointer', fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase',
              fontWeight: 600, color: '#0a0600', padding: '14px 40px', borderRadius: '50px',
              background: '#0a0600', color: '#f5c842', border: 'none',
              boxShadow: '0 6px 20px rgba(10,6,0,0.3)',
            }}>
            Make Another Booking
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="page-hero">
        <p className="section-label">Dine With Us</p>
        <h1 style={{ fontFamily: 'var(--font-playfair)' }}>Reserve a Table</h1>
        <p>Secure your table with a R100 deposit, deducted from your final bill.</p>
      </div>

      {/* Step indicator */}
      <div style={{ padding: '32px 0', background: '#0a0600', borderBottom: '1px solid #2e2000' }}>
        <div className="section-wrap">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {[{ n: 1, label: 'Occasion' }, { n: 2, label: 'Date & Time' }, { n: 3, label: 'Details' }].map((s, i) => (
              <div key={s.n} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700,
                    background: step > s.n ? '#c8940c' : step === s.n ? '#f5c842' : '#1e1500',
                    border: step >= s.n ? '1px solid #f5c842' : '1px solid #2e2000',
                    color: step >= s.n ? '#0a0600' : 'rgba(255,255,255,0.3)',
                    transition: 'all 0.3s',
                  }}>
                    {step > s.n ? '✓' : s.n}
                  </div>
                  <span style={{ fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', color: step >= s.n ? '#f5c842' : 'rgba(255,255,255,0.3)' }}>
                    {s.label}
                  </span>
                </div>
                {i < 2 && (
                  <div style={{ width: '80px', height: '1px', background: step > s.n ? '#c8940c' : '#2e2000', margin: '0 8px 20px', transition: 'background 0.3s' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <section style={{ padding: '60px 0 100px', background: '#0a0600' }}>
        <div className="section-wrap" style={{ maxWidth: '680px' }}>

          {/* Step 1 */}
          {step === 1 && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '32px', fontWeight: 700, color: '#fafafa', marginBottom: '8px' }}>
                What's the occasion?
              </h2>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '40px' }}>
                Tell us what you're celebrating — we'll make it unforgettable.
              </p>
              {['Romantic', 'Business', 'Special Occasion'].map(cat => {
                const catOccs = occasions.filter(o => (o.category || 'Special Occasion') === cat)
                if (catOccs.length === 0) return null
                const catEmoji = cat === 'Romantic' ? '💕' : cat === 'Business' ? '💼' : '🎉'
                return (
                  <div key={cat} style={{ marginBottom: '36px' }}>
                    <p style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: '#f5c842', marginBottom: '16px' }}>
                      {catEmoji} {cat}
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                      {catOccs.map(occ => (
                        <div key={occ.id} onClick={() => setForm(f => ({ ...f, occasion: occ.id }))} style={{
                          background: form.occasion === occ.id ? 'rgba(200,148,12,0.2)' : '#1e1500',
                          border: form.occasion === occ.id ? '1px solid #f5c842' : '1px solid #2e2000',
                          borderRadius: '14px', padding: '20px 16px', cursor: 'pointer',
                          transition: 'all 0.25s', textAlign: 'center',
                        }}>
                          <div style={{ fontSize: '32px', marginBottom: '8px' }}>{occ.emoji}</div>
                          <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '15px', color: '#fafafa', marginBottom: '4px' }}>{occ.label}</h3>
                          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4, marginBottom: '8px' }}>{occ.description}</p>
                          <p style={{ fontSize: '12px', color: '#f5c842', fontWeight: 700 }}>
                            R{((occ.price_cents || 0) / 100).toFixed(0)} deposit
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
              {needsReason && (
                <div ref={reasonRef} style={{ marginBottom: '32px', maxWidth: '360px', scrollMarginTop: '90px' }}>
                  <label style={labelStyle}>What's the romantic occasion?</label>
                  <select
                    value={form.occasionReason}
                    onChange={e => setForm(f => ({ ...f, occasionReason: e.target.value }))}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#f5c842'}
                    onBlur={e => e.target.style.borderColor = '#2e2000'}
                  >
                    <option value="">Select a reason…</option>
                    {ROMANTIC_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              )}
              <button disabled={!step1Ready} onClick={() => setStep(2)} style={{
                cursor: step1Ready ? 'pointer' : 'not-allowed',
                fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase',
                fontWeight: 600, color: '#0a0600', padding: '16px 48px', borderRadius: '50px',
                background: step1Ready ? 'linear-gradient(135deg, #f5c842, #c8940c)' : '#2e2000',
                border: 'none', opacity: step1Ready ? 1 : 0.5, transition: 'all 0.2s',
                boxShadow: step1Ready ? '0 6px 20px rgba(200,148,12,0.4)' : 'none',
              }}>
                Continue →
              </button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '32px', fontWeight: 700, color: '#fafafa', marginBottom: '8px' }}>
                When are you joining us?
              </h2>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '40px' }}>
                Pick your preferred date, time, and party size.
              </p>
              <div style={{ display: 'grid', gap: '24px', marginBottom: '40px' }}>
                <div>
                  <label style={labelStyle}>Date</label>
                  <input
                    type="date" value={form.date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    style={{ ...inputStyle, colorScheme: 'dark', borderColor: isClosedDay(form.date) ? '#c0392b' : '#2e2000' }}
                    onFocus={e => e.target.style.borderColor = '#f5c842'}
                    onBlur={e => e.target.style.borderColor = isClosedDay(form.date) ? '#c0392b' : '#2e2000'}
                  />
                  <p style={{ fontSize: '12px', margin: '8px 0 0', color: isClosedDay(form.date) ? '#ff8a7a' : 'rgba(255,255,255,0.4)' }}>
                    {isClosedDay(form.date)
                      ? `We're closed on ${CLOSED_DAY_NAMES[new Date(form.date + 'T00:00:00').getDay()]}s. Please pick another day.`
                      : 'We are closed on Sundays and Mondays.'}
                  </p>

                  <p style={{ fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: '#f5c842', margin: '18px 0 10px' }}>
                    Next available dates
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {NEXT_OPEN_DATES.map(d => (
                      <button
                        key={d.date}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, date: d.date }))}
                        style={{
                          cursor: 'pointer', padding: '9px 14px', borderRadius: '20px',
                          fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap',
                          background: form.date === d.date ? 'linear-gradient(135deg,#f5c842,#c8940c)' : '#1e1500',
                          color: form.date === d.date ? '#0a0600' : 'rgba(255,255,255,0.6)',
                          border: `1px solid ${form.date === d.date ? 'transparent' : '#2e2000'}`,
                        }}
                      >{d.label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Time</label>
                  <select value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#f5c842'}
                    onBlur={e => e.target.style.borderColor = '#2e2000'}
                  >
                    <option value="">Select a time</option>
                    {['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Number of Guests</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button type="button" onClick={() => setForm(f => ({ ...f, guests: Math.max(1, f.guests - 1) }))} style={{
                      width: '44px', height: '44px', borderRadius: '50%',
                      background: '#1e1500', border: '1px solid #2e2000', color: '#fafafa',
                      fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>−</button>
                    <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '36px', color: '#f5c842', minWidth: '60px', textAlign: 'center' }}>
                      {form.guests}
                    </span>
                    <button type="button" onClick={() => setForm(f => ({ ...f, guests: Math.min(20, f.guests + 1) }))} style={{
                      width: '44px', height: '44px', borderRadius: '50%',
                      background: '#1e1500', border: '1px solid #2e2000', color: '#fafafa',
                      fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>+</button>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>guests</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setStep(1)} style={{
                  cursor: 'pointer', fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase',
                  fontWeight: 600, color: 'rgba(255,255,255,0.6)', padding: '16px 32px', borderRadius: '50px',
                  background: 'transparent', border: '1px solid #2e2000',
                }}>← Back</button>
                {(() => {
                  const ok = Boolean(form.date) && Boolean(form.time) && !isClosedDay(form.date)
                  return (
                    <button type="button" disabled={!ok} onClick={() => setStep(3)} style={{
                      cursor: ok ? 'pointer' : 'not-allowed',
                      fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase',
                      fontWeight: 600, color: '#0a0600', padding: '16px 48px', borderRadius: '50px',
                      background: ok ? 'linear-gradient(135deg, #f5c842, #c8940c)' : '#2e2000',
                      border: 'none', opacity: ok ? 1 : 0.5,
                    }}>Continue →</button>
                  )
                })()}
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <form onSubmit={handleSubmit}>
              <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '32px', fontWeight: 700, color: '#fafafa', marginBottom: '8px' }}>
                Your Details
              </h2>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '40px' }}>
                Almost there! Fill in your details and choose any add-ons.
              </p>

              <div style={{ display: 'grid', gap: '20px', marginBottom: '32px' }}>
                {[
                  { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Your name' },
                  { label: 'Email Address', key: 'email', type: 'email', placeholder: 'your@email.com' },
                  { label: 'Phone Number', key: 'phone', type: 'tel', placeholder: '+27 ...' },
                ].map((field) => (
                  <div key={field.key}>
                    <label style={labelStyle}>{field.label}</label>
                    <input
                      type={field.type} required
                      placeholder={field.placeholder}
                      value={form[field.key]}
                      onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = '#f5c842'}
                      onBlur={e => { e.target.style.borderColor = '#2e2000'; if (field.key === 'email') lookupBucks(e.target.value) }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Add-Ons (Optional)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {addOns.map(addon => {
                    const selected = form.selectedAddOns.includes(addon.id)
                    const custom = isCustomAmount(addon)
                    const images = Array.isArray(addon.images) ? addon.images : []
                    const colors = Array.isArray(addon.colors) ? addon.colors : []
                    return (
                      <div key={addon.id} style={{
                        background: selected ? 'rgba(200,148,12,0.2)' : '#1e1500',
                        border: selected ? '1px solid #f5c842' : '1px solid #2e2000',
                        borderRadius: '12px', padding: '16px', transition: 'all 0.2s',
                      }}>
                        <div onClick={() => toggleAddOn(addon.id)} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                          <span style={{ fontSize: '22px', flexShrink: 0 }}>{addon.icon}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '14px', fontWeight: 500, color: '#fafafa' }}>{addon.label}</div>
                            {addon.description && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>{addon.description}</div>}
                            <div style={{ fontSize: '12px', color: '#f5c842', marginTop: '2px' }}>
                              {custom ? 'Choose an amount' : addon.price === 0 ? 'Free' : `R ${addon.price}`}
                            </div>
                          </div>
                          <div style={{
                            width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0,
                            border: selected ? 'none' : '1px solid #3d2a00',
                            background: selected ? '#f5c842' : 'transparent',
                            color: '#0a0600', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700,
                          }}>{selected ? '✓' : ''}</div>
                        </div>

                        {/* Photo gallery */}
                        {images.length > 0 && (
                          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginTop: '12px', paddingBottom: '4px' }}>
                            {images.map((url, i) => (
                              <img key={i} src={url} alt="" onClick={(e) => { e.stopPropagation(); setLightbox(url) }}
                                style={{ width: '84px', height: '84px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0, cursor: 'zoom-in', border: '1px solid #2e2000' }} />
                            ))}
                          </div>
                        )}

                        {/* Colour picker */}
                        {colors.length > 0 && (
                          <div style={{ marginTop: '12px' }} onClick={e => e.stopPropagation()}>
                            <div style={{ fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
                              Choose a colour{selected ? ' *' : ''}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              {colors.map(c => {
                                const active = addonColors[addon.id] === c
                                return (
                                  <button key={c} type="button"
                                    onClick={() => { setAddonColors(m => ({ ...m, [addon.id]: c })); if (!selected) toggleAddOn(addon.id) }}
                                    style={{
                                      padding: '7px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '12px',
                                      background: active ? 'linear-gradient(135deg, #f5c842, #c8940c)' : '#0a0600',
                                      color: active ? '#0a0600' : 'rgba(255,255,255,0.7)',
                                      border: `1px solid ${active ? '#f5c842' : '#2e2000'}`, fontWeight: active ? 700 : 400,
                                    }}>
                                    {c}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* Custom amount (gift card) */}
                        {custom && selected && (
                          <div style={{ marginTop: '12px' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '14px', color: '#f5c842', fontWeight: 600 }}>R</span>
                              <input
                                type="number" min="0" step="10" placeholder="Amount"
                                value={addonAmounts[addon.id] ?? ''}
                                onChange={e => setAddonAmounts(m => ({ ...m, [addon.id]: e.target.value }))}
                                onClick={e => e.stopPropagation()}
                                style={{ ...inputStyle, padding: '10px 12px' }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Special Song Request</label>
                <input type="text" placeholder="Song name & artist (optional)"
                  value={form.specialSong}
                  onChange={e => setForm(f => ({ ...f, specialSong: e.target.value }))}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#f5c842'}
                  onBlur={e => e.target.style.borderColor = '#2e2000'}
                />
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={labelStyle}>Special Request</label>
                <textarea rows={4} placeholder="Dietary requirements, allergies, or anything else..."
                  value={form.specialRequest}
                  onChange={e => setForm(f => ({ ...f, specialRequest: e.target.value }))}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  onFocus={e => e.target.style.borderColor = '#f5c842'}
                  onBlur={e => e.target.style.borderColor = '#2e2000'}
                />
              </div>

              {/* Payment options — voucher + Khula Bucks toward deposit */}
              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Voucher / Khula Bucks (optional)</label>

                {/* Voucher */}
                {voucherApplied ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', background: 'rgba(38,222,129,0.08)', border: '1px solid rgba(38,222,129,0.3)', borderRadius: '10px', padding: '12px 14px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '13px', color: '#26de81' }}>🎟️ Voucher <strong>{voucherApplied.code}</strong> applied — R{(voucherApplied.amount_cents / 100).toFixed(0)}</span>
                    <button type="button" onClick={removeVoucher} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '13px' }}>Remove</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                    <input type="text" placeholder="Voucher code" value={voucherCode}
                      onChange={e => { setVoucherCode(e.target.value.toUpperCase()); setVoucherError('') }}
                      style={{ ...inputStyle, flex: 1 }}
                      onFocus={e => e.target.style.borderColor = '#f5c842'}
                      onBlur={e => e.target.style.borderColor = '#2e2000'} />
                    <button type="button" onClick={() => applyVoucher()} disabled={voucherChecking || !voucherCode.trim()} style={{
                      padding: '0 22px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                      background: voucherCode.trim() ? 'linear-gradient(135deg, #f5c842, #c8940c)' : '#1e1500',
                      color: voucherCode.trim() ? '#0a0600' : '#f5c842', fontWeight: 700, fontSize: '12px', whiteSpace: 'nowrap',
                    }}>{voucherChecking ? 'Checking…' : 'Apply'}</button>
                  </div>
                )}
                {voucherError && <p style={{ fontSize: '12px', color: '#ff6b6b', margin: '0 0 10px' }}>{voucherError}</p>}

                {/* Khula Bucks */}
                {loyalty && loyalty.khulaBucks > 0 && afterVoucher > 0 && (
                  <div style={{ border: `1px solid ${useBucks ? 'rgba(245,200,66,0.5)' : '#2e2000'}`, borderRadius: '10px', padding: '14px', background: useBucks ? 'rgba(245,200,66,0.06)' : '#1e1500', marginTop: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: '#f5c842', fontWeight: 700 }}>💛 {loyalty.khulaBucks} Khula Bucks available</span>
                      <button type="button" onClick={() => { setUseBucks(u => !u); setBucksToUse(useBucks ? 0 : Math.min(loyalty.khulaBucks, Math.floor(afterVoucher))) }}
                        style={{ width: '46px', height: '25px', borderRadius: '13px', border: 'none', cursor: 'pointer', flexShrink: 0, background: useBucks ? 'linear-gradient(135deg,#f5c842,#c8940c)' : '#2e2000', position: 'relative' }}>
                        <span style={{ position: 'absolute', top: '3px', width: '19px', height: '19px', borderRadius: '50%', background: '#fafafa', transition: 'left 0.2s', left: useBucks ? '24px' : '3px' }} />
                      </button>
                    </div>
                    {useBucks && (
                      <div style={{ marginTop: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
                          <span style={{ color: 'rgba(255,255,255,0.5)' }}>Bucks to use</span>
                          <span style={{ color: '#f5c842', fontWeight: 700 }}>{bucksRands} = R{bucksRands} off</span>
                        </div>
                        <input type="range" min={0} max={Math.min(loyalty.khulaBucks, Math.floor(afterVoucher))} step={1}
                          value={bucksToUse} onChange={e => setBucksToUse(Number(e.target.value))}
                          style={{ width: '100%', accentColor: '#f5c842', cursor: 'pointer' }} />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Summary */}
              <div style={{ background: '#1e1500', border: '1px solid #2e2000', borderRadius: '12px', padding: '20px', marginBottom: '32px' }}>
                <h4 style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: '#f5c842', marginBottom: '16px' }}>
                  Booking Summary
                </h4>
                {[
                  { label: 'Occasion', value: occasions.find(o => o.id === form.occasion)?.label },
                  { label: 'Date', value: form.date },
                  { label: 'Time', value: form.time },
                  { label: 'Guests', value: form.guests },
                  ...(form.selectedAddOns.length === 0
                    ? [{ label: 'Add-ons', value: 'None' }]
                    : addOns.filter(a => form.selectedAddOns.includes(a.id)).map(a => {
                        const price = addonPrice(a)
                        const colour = addonColors[a.id] ? ` (${addonColors[a.id]})` : ''
                        return {
                          label: `${a.label}${colour}`,
                          value: isCustomAmount(a) && !(price > 0) ? 'Enter an amount' : price > 0 ? `R${price.toFixed(0)}` : 'Free',
                          warn: isCustomAmount(a) && !(price > 0),
                        }
                      })),
                  { label: 'Deposit', value: `R${(depositCents / 100).toFixed(0)}` },
                  ...(voucherRands > 0 ? [{ label: `Voucher ${voucherApplied.code}`, value: `−R${voucherRands.toFixed(0)}`, good: true }] : []),
                  ...(!voucherApplied && voucherCode.trim() ? [{ label: `Voucher ${voucherCode.trim()}`, value: voucherChecking ? 'Checking…' : 'Not applied', warn: true }] : []),
                  ...(bucksRands > 0 ? [{ label: `Khula Bucks (${bucksRands})`, value: `−R${bucksRands.toFixed(0)}`, good: true }] : []),
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{row.label}</span>
                    <span style={{ fontSize: '13px', color: row.good ? '#26de81' : row.warn ? '#ff9f43' : '#fafafa', fontWeight: 500 }}>{row.value}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '14px', borderTop: '1px solid #2e2000' }}>
                  <span style={{ fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase', color: '#f5c842', fontWeight: 700 }}>Deposit Due Now</span>
                  <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '22px', color: '#fafafa', fontWeight: 700 }}>R{depositDue.toFixed(0)}</span>
                </div>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: '6px 0 0', lineHeight: 1.5 }}>
                  The deposit secures your table and is deducted from your final bill. {totalAddOns > 0 ? `Add-ons (R${totalAddOns.toFixed(0)}) are settled on the day.` : ''}
                </p>
              </div>

              {submitError && (
                <p style={{ color: '#ff6b6b', fontSize: '13px', marginBottom: '16px' }}>{submitError}</p>
              )}
              {submitNotice && (
                <p style={{ color: '#f5c842', fontSize: '13px', marginBottom: '16px' }}>{submitNotice}</p>
              )}

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setStep(2)} style={{
                  cursor: 'pointer', fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase',
                  fontWeight: 600, color: 'rgba(255,255,255,0.6)', padding: '16px 32px', borderRadius: '50px',
                  background: 'transparent', border: '1px solid #2e2000',
                }}>← Back</button>
                <button type="submit" disabled={loading} style={{
                  flex: 1, cursor: loading ? 'wait' : 'pointer',
                  fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase',
                  fontWeight: 700, color: '#0a0600', padding: '16px 40px', borderRadius: '50px',
                  background: 'linear-gradient(135deg, #f5c842, #c8940c)',
                  border: 'none', boxShadow: '0 6px 20px rgba(200,148,12,0.35)',
                  opacity: loading ? 0.7 : 1,
                }}>
                  {loading ? 'Confirming...' : depositDue === 0 ? 'Confirm Booking — Deposit Covered' : `Confirm & Pay R${depositDue.toFixed(0)} Deposit`}
                </button>
              </div>
            </form>
          )}

        </div>
      </section>

      {/* Image lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{
          position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', cursor: 'zoom-out',
        }}>
          <img src={lightbox} alt="" style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '12px', objectFit: 'contain' }} />
          <button onClick={() => setLightbox(null)} style={{
            position: 'fixed', top: '20px', right: '20px', width: '40px', height: '40px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer',
          }}>✕</button>
        </div>
      )}
    </>
  )
}
