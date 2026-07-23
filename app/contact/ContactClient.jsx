'use client'
import { useState } from 'react'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import { submitContactMessage } from './actions'
import { telHref, waHref, mailtoHref, mapsHref, socialUrl } from '../../lib/contact-links'

const iconStyle = { width: '22px', height: '22px', display: 'block' }
const SOCIAL_ICONS = {
  instagram: (<svg viewBox="0 0 24 24" fill="currentColor" style={iconStyle}><path d="M12 2.2c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.22.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.05.41 2.22.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.22-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.05.36-2.22.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.22-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.05-.41-2.22C3.21 15.58 3.2 15.2 3.2 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.22.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.05-.36 2.22-.41C8.42 2.21 8.8 2.2 12 2.2zm0 1.8c-3.14 0-3.51.01-4.75.07-.9.04-1.38.19-1.7.32-.43.17-.74.37-1.06.69-.32.32-.52.63-.69 1.06-.13.32-.28.8-.32 1.7-.06 1.24-.07 1.61-.07 4.75s.01 3.51.07 4.75c.04.9.19 1.38.32 1.7.17.43.37.74.69 1.06.32.32.63.52 1.06.69.32.13.8.28 1.7.32 1.24.06 1.61.07 4.75.07s3.51-.01 4.75-.07c.9-.04 1.38-.19 1.7-.32.43-.17.74-.37 1.06-.69.32-.32.52-.63.69-1.06.13-.32.28-.8.32-1.7.06-1.24.07-1.61.07-4.75s-.01-3.51-.07-4.75c-.04-.9-.19-1.38-.32-1.7a2.86 2.86 0 0 0-.69-1.06 2.86 2.86 0 0 0-1.06-.69c-.32-.13-.8-.28-1.7-.32C15.51 4.01 15.14 4 12 4zm0 3.05A4.95 4.95 0 1 1 7.05 12 4.95 4.95 0 0 1 12 7.05zm0 1.8A3.15 3.15 0 1 0 15.15 12 3.15 3.15 0 0 0 12 8.85zM17.65 6.35a1.15 1.15 0 1 1-1.15 1.15 1.15 1.15 0 0 1 1.15-1.15z"/></svg>),
  tiktok: (<svg viewBox="0 0 24 24" fill="currentColor" style={iconStyle}><path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.1v12.4a2.5 2.5 0 1 1-2.5-2.5c.2 0 .4.03.6.08V9.8a5.6 5.6 0 0 0-.6-.04A5.55 5.55 0 1 0 15.5 15.3V9.3a7.3 7.3 0 0 0 4.3 1.38V7.6a4.3 4.3 0 0 1-3.2-1.78z"/></svg>),
  facebook: (<svg viewBox="0 0 24 24" fill="currentColor" style={iconStyle}><path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5H17V3.62c-.29-.04-1.28-.12-2.43-.12-2.4 0-4.07 1.47-4.07 4.17V9.9H7.8V13h2.7v8z"/></svg>),
  whatsapp: (<svg viewBox="0 0 24 24" fill="currentColor" style={iconStyle}><path d="M17.5 14.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.08-.3-.15-1.26-.47-2.4-1.48-.89-.8-1.49-1.78-1.66-2.08-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.53.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.05 1.02-1.05 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.2 5.08 4.48.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35zM12 2a10 10 0 0 0-8.5 15.26L2 22l4.85-1.27A10 10 0 1 0 12 2zm0 1.8a8.2 8.2 0 0 1 6.96 12.56l-.2.32.66 2.42-2.48-.65-.31.18A8.2 8.2 0 1 1 12 3.8z"/></svg>),
}

export default function ContactClient({ settings }) {
  useScrollReveal()
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await submitContactMessage(form)
      setSent(true)
    } catch (err) {
      setError(`Something went wrong. Please try again or WhatsApp us at ${settings.phone}.`)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '14px 18px', borderRadius: '10px',
    background: '#1e1500', border: '1px solid #2e2000', color: '#fafafa',
    fontSize: '14px', outline: 'none', transition: 'border-color 0.2s',
    fontFamily: 'var(--font-poppins)',
  }

  const contactInfo = [
    { icon: '📍', label: 'Address', value: settings.address, href: mapsHref(settings.address), external: true },
    { icon: '📞', label: 'Phone — tap to call', value: settings.phone, href: telHref(settings.phone) },
    { icon: '✉️', label: 'Email', value: settings.email, href: mailtoHref(settings.email) },
    { icon: '💬', label: 'WhatsApp — tap to chat', value: 'Message us on WhatsApp', href: waHref(settings.whatsapp), external: true },
  ].filter(i => i.value && i.href)

  const socials = [
    { key: 'instagram', label: 'Instagram', url: socialUrl('instagram', settings.instagram) },
    { key: 'tiktok', label: 'TikTok', url: socialUrl('tiktok', settings.tiktok) },
    { key: 'facebook', label: 'Facebook', url: socialUrl('facebook', settings.facebook) },
    { key: 'whatsapp', label: 'WhatsApp', url: waHref(settings.whatsapp) },
  ].filter(s => s.url)

  const hours = Array.isArray(settings.trading_hours) ? settings.trading_hours : []

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
                {contactInfo.map((item, i) => {
                  const cardStyle = {
                    display: 'flex', gap: '16px', alignItems: 'flex-start',
                    padding: '18px', background: '#1e1500', borderRadius: '12px',
                    border: '1px solid #2e2000', textDecoration: 'none',
                  }
                  const inner = (
                    <>
                      <span style={{ fontSize: '22px', marginTop: '2px' }}>{item.icon}</span>
                      <div>
                        <div style={{ fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: '#f5c842', marginBottom: '4px' }}>{item.label}</div>
                        <div style={{ fontSize: '14px', color: '#fafafa', lineHeight: 1.5 }}>{item.value}</div>
                      </div>
                    </>
                  )
                  return (
                    <a key={i} href={item.href} {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      data-reveal data-delay={`${i * 80}`} style={cardStyle}>
                      {inner}
                    </a>
                  )
                })}
              </div>

              {/* Hours */}
              {hours.length > 0 && (
                <div data-reveal style={{ background: '#1e1500', borderRadius: '14px', padding: '24px', border: '1px solid #2e2000' }}>
                  <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '18px', color: '#fafafa', marginBottom: '16px' }}>Trading Hours</h3>
                  {hours.map((row, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #2e2000' }}>
                      <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{row.day}</span>
                      <span style={{ fontSize: '13px', color: '#fafafa', fontWeight: 500 }}>{row.hours}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <span className="pulse-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f5c842', display: 'block', flexShrink: 0 }} />
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Currently open & cooking</span>
                  </div>
                </div>
              )}

              {/* Socials */}
              {socials.length > 0 && (
                <div data-reveal style={{ marginTop: '32px' }}>
                  <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '18px', color: '#fafafa', marginBottom: '4px' }}>Follow Us</h3>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>Follow us for specials, events &amp; updates</p>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {socials.map(s => (
                      <a key={s.key} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label} title={s.label} style={{
                        width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: '#1e1500', border: '1px solid #2e2000', color: '#f5c842',
                        textDecoration: 'none', transition: 'transform 0.2s, border-color 0.2s',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = '#c8940c' }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = '#2e2000' }}
                      >
                        {SOCIAL_ICONS[s.key]}
                      </a>
                    ))}
                  </div>
                </div>
              )}
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
                  {error && (
                    <p style={{ fontSize: '13px', color: '#f87171', background: 'rgba(248,113,113,0.1)', padding: '12px 16px', borderRadius: '8px', margin: 0 }}>
                      {error}
                    </p>
                  )}
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
