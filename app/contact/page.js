'use client'
import { useState } from 'react'
import { useScrollReveal } from '../../hooks/useScrollReveal'

export default function ContactPage() {
  useScrollReveal()
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    setLoading(false)
    setSent(true)
  }

  const inputStyle = {
    width: '100%', padding: '14px 18px', borderRadius: '10px',
    background: '#1e1500', border: '1px solid #2e2000', color: '#fafafa',
    fontSize: '14px', outline: 'none', transition: 'border-color 0.2s',
    fontFamily: 'var(--font-poppins)',
  }

  const contactInfo = [
    { icon: '📍', label: 'Address', value: 'Cnr Old Main Road & St Johns Avenue, Dickswell Centre, Pinetown' },
    { icon: '📞', label: 'Phone / WhatsApp', value: '061 489 4615' },
    { icon: '✉️', label: 'Email', value: 'hello@khulacafe.co.za' },
    { icon: '💬', label: 'WhatsApp Order', value: 'WhatsApp your order — we will deliver to you!' },
  ]

  return (
    <>
      <div className="page-hero">
        <p className="section-label">Get in Touch</p>
        <h1 style={{ fontFamily: 'var(--font-playfair)' }}>Contact Us</h1>
        <p>We'd love to hear from you. Drop us a message or stop by.</p>
      </div>

      <section style={{ padding: '80px 0 100px', background: '#0a0600' }}>
        <div className="section-wrap">
          <div className="two-col-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '64px' }}>

            {/* Contact info */}
            <div>
              <h2 data-reveal style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 700, color: '#fafafa', marginBottom: '32px' }}>
                Find Us
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '48px' }}>
                {contactInfo.map((item, i) => (
                  <div key={i} data-reveal data-delay={`${i * 80}`} style={{
                    display: 'flex', gap: '16px', alignItems: 'flex-start',
                    padding: '18px', background: '#1e1500', borderRadius: '12px',
                    border: '1px solid #2e2000',
                  }}>
                    <span style={{ fontSize: '22px', marginTop: '2px' }}>{item.icon}</span>
                    <div>
                      <div style={{ fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: '#f5c842', marginBottom: '4px' }}>{item.label}</div>
                      <div style={{ fontSize: '14px', color: '#fafafa' }}>{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Hours */}
              <div data-reveal style={{ background: '#1e1500', borderRadius: '14px', padding: '24px', border: '1px solid #2e2000' }}>
                <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '18px', color: '#fafafa', marginBottom: '16px' }}>Trading Hours</h3>
                {[
                  { day: 'Monday – Thursday', hours: '08:00 – 21:00' },
                  { day: 'Friday – Saturday', hours: '08:00 – 23:00' },
                  { day: 'Sunday', hours: '09:00 – 20:00' },
                  { day: 'Public Holidays', hours: '09:00 – 18:00' },
                ].map(row => (
                  <div key={row.day} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #2e2000' }}>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{row.day}</span>
                    <span style={{ fontSize: '13px', color: '#fafafa', fontWeight: 500 }}>{row.hours}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <span className="pulse-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f5c842', display: 'block', flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Currently open & cooking</span>
                </div>
              </div>
            </div>

            {/* Contact form */}
            <div>
              <h2 data-reveal style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 700, color: '#fafafa', marginBottom: '32px' }}>
                Send a Message
              </h2>

              {sent ? (
                <div data-reveal style={{
                  textAlign: 'center', padding: '48px 24px',
                  background: '#1e1500', borderRadius: '16px', border: '1px solid #c8940c',
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                  <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '24px', color: '#f5c842', marginBottom: '12px' }}>Message Sent!</h3>
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                    Thank you, {form.name}! We'll be in touch within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {[
                    { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Your name' },
                    { label: 'Email Address', key: 'email', type: 'email', placeholder: 'your@email.com' },
                    { label: 'Phone (optional)', key: 'phone', type: 'tel', placeholder: '+27 ...' },
                  ].map((field, i) => (
                    <div key={field.key} data-reveal data-delay={`${i * 80}`}>
                      <label style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: '#f5c842', display: 'block', marginBottom: '8px' }}>
                        {field.label}
                      </label>
                      <input
                        type={field.type}
                        required={field.key !== 'phone'}
                        placeholder={field.placeholder}
                        value={form[field.key]}
                        onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                        style={inputStyle}
                        onFocus={e => e.target.style.borderColor = '#f5c842'}
                        onBlur={e => e.target.style.borderColor = '#2e2000'}
                      />
                    </div>
                  ))}
                  <div data-reveal data-delay="240">
                    <label style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: '#f5c842', display: 'block', marginBottom: '8px' }}>
                      Message
                    </label>
                    <textarea
                      rows={5} required placeholder="How can we help you?"
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      style={{ ...inputStyle, resize: 'vertical' }}
                      onFocus={e => e.target.style.borderColor = '#f5c842'}
                      onBlur={e => e.target.style.borderColor = '#2e2000'}
                    />
                  </div>
                  <button data-reveal data-delay="300" type="submit" disabled={loading} style={{
                    cursor: loading ? 'wait' : 'pointer',
                    fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase',
                    fontWeight: 600, color: '#0a0600', padding: '16px', borderRadius: '50px',
                    background: 'linear-gradient(135deg, #f5c842, #c8940c)',
                    border: 'none', boxShadow: '0 6px 20px rgba(200,148,12,0.4)',
                    opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s',
                  }}>
                    {loading ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
