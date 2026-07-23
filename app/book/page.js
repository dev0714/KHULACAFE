'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase-public'
import { createBooking } from '../admin/actions'

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
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [bookingRef, setBookingRef] = useState('')
  const [submitError, setSubmitError] = useState('')

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

  const ROMANTIC_REASONS = ['Proposal', 'Engagement', 'Anniversary', 'Date Night', "Valentine's Day", 'Birthday Surprise', 'Just Because']
  const needsReason = /romantic/i.test(selectedOccasion?.label || '') || selectedOccasion?.category === 'Romantic'
  const step1Ready = !!form.occasion && (!needsReason || !!form.occasionReason)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')
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
          <button onClick={() => { setSuccess(false); setStep(1); setAddonAmounts({}); setAddonColors({}); setForm({ occasion:'', date:'', time:'', guests:2, name:'', email:'', phone:'', selectedAddOns:[], specialRequest:'', specialSong:'', occasionReason:'' }) }}
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
                <div style={{ marginBottom: '32px', maxWidth: '360px' }}>
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
                    style={{ ...inputStyle, colorScheme: 'dark' }}
                    onFocus={e => e.target.style.borderColor = '#f5c842'}
                    onBlur={e => e.target.style.borderColor = '#2e2000'}
                  />
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
                <button type="button" disabled={!form.date || !form.time} onClick={() => setStep(3)} style={{
                  cursor: form.date && form.time ? 'pointer' : 'not-allowed',
                  fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase',
                  fontWeight: 600, color: '#0a0600', padding: '16px 48px', borderRadius: '50px',
                  background: form.date && form.time ? 'linear-gradient(135deg, #f5c842, #c8940c)' : '#2e2000',
                  border: 'none', opacity: form.date && form.time ? 1 : 0.5,
                }}>Continue →</button>
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
                      onBlur={e => e.target.style.borderColor = '#2e2000'}
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
                  { label: 'Add-ons', value: totalAddOns > 0 ? `R ${totalAddOns.toFixed(0)}` : 'None' },
                  { label: 'Deposit (paid now)', value: `R${(depositCents / 100).toFixed(0)}` },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{row.label}</span>
                    <span style={{ fontSize: '13px', color: '#fafafa', fontWeight: 500 }}>{row.value}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '14px', borderTop: '1px solid #2e2000' }}>
                  <span style={{ fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase', color: '#f5c842', fontWeight: 700 }}>Total Owing</span>
                  <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '22px', color: '#fafafa', fontWeight: 700 }}>R{totalOwing.toFixed(0)}</span>
                </div>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: '6px 0 0', lineHeight: 1.5 }}>
                  Deposit is paid now to secure your table and is deducted from your final bill. Add-ons are settled on the day.
                </p>
              </div>

              {submitError && (
                <p style={{ color: '#ff6b6b', fontSize: '13px', marginBottom: '16px' }}>{submitError}</p>
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
                  {loading ? 'Confirming...' : `Confirm & Pay R${(depositCents / 100).toFixed(0)} Deposit`}
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
