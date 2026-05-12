'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase-public'

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
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

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
    return sum + (a ? a.price : 0)
  }, 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 1500))
    setLoading(false)
    setSuccess(true)
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
            A confirmation will be sent to {form.email}. The R100 deposit will be deducted from your final bill.
          </p>
          <div style={{ background: 'rgba(0,0,0,0.12)', border: '1px solid rgba(61,34,0,0.3)', borderRadius: '12px', padding: '20px', marginBottom: '40px' }}>
            <p style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: '#3d2200', marginBottom: '8px' }}>
              Your Booking Reference
            </p>
            <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '28px', color: '#0a0600', letterSpacing: '4px' }}>
              KHU-{Math.floor(Math.random() * 90000) + 10000}
            </p>
          </div>
          <button onClick={() => { setSuccess(false); setStep(1); setForm({ occasion:'', date:'', time:'', guests:2, name:'', email:'', phone:'', selectedAddOns:[], specialRequest:'', specialSong:'' }) }}
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '40px' }}>
                {occasions.map((occ) => (
                  <div key={occ.id} onClick={() => setForm(f => ({ ...f, occasion: occ.id }))} style={{
                    background: form.occasion === occ.id ? 'rgba(200,148,12,0.2)' : '#1e1500',
                    border: form.occasion === occ.id ? '1px solid #f5c842' : '1px solid #2e2000',
                    borderRadius: '14px', padding: '28px', cursor: 'pointer',
                    transition: 'all 0.25s', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>{occ.emoji}</div>
                    <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '18px', color: '#fafafa', marginBottom: '6px' }}>{occ.label}</h3>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{occ.description}</p>
                  </div>
                ))}
              </div>
              <button disabled={!form.occasion} onClick={() => setStep(2)} style={{
                cursor: form.occasion ? 'pointer' : 'not-allowed',
                fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase',
                fontWeight: 600, color: '#0a0600', padding: '16px 48px', borderRadius: '50px',
                background: form.occasion ? 'linear-gradient(135deg, #f5c842, #c8940c)' : '#2e2000',
                border: 'none', opacity: form.occasion ? 1 : 0.5, transition: 'all 0.2s',
                boxShadow: form.occasion ? '0 6px 20px rgba(200,148,12,0.4)' : 'none',
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  {addOns.map(addon => (
                    <div key={addon.id} onClick={() => toggleAddOn(addon.id)} style={{
                      background: form.selectedAddOns.includes(addon.id) ? 'rgba(200,148,12,0.2)' : '#1e1500',
                      border: form.selectedAddOns.includes(addon.id) ? '1px solid #f5c842' : '1px solid #2e2000',
                      borderRadius: '10px', padding: '16px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s',
                    }}>
                      <span style={{ fontSize: '22px' }}>{addon.icon}</span>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: '#fafafa' }}>{addon.label}</div>
                        <div style={{ fontSize: '12px', color: '#f5c842' }}>{addon.price === 0 ? 'Free' : `R ${addon.price}`}</div>
                      </div>
                    </div>
                  ))}
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
                  { label: 'Add-ons', value: totalAddOns > 0 ? `R ${totalAddOns}` : 'None' },
                  { label: 'Deposit', value: 'R 100 (deducted from bill)' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{row.label}</span>
                    <span style={{ fontSize: '13px', color: '#fafafa', fontWeight: 500 }}>{row.value}</span>
                  </div>
                ))}
              </div>

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
                  {loading ? 'Confirming...' : 'Confirm & Pay R100 Deposit'}
                </button>
              </div>
            </form>
          )}

        </div>
      </section>
    </>
  )
}
