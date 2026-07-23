'use client'
import { useState, useTransition } from 'react'
import { saveContactSettings } from '../actions'

const inp = { width: '100%', padding: '10px 14px', background: '#0a0600', border: '1px solid #2e2000', borderRadius: '8px', color: '#fafafa', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }
const lbl = { display: 'block', fontSize: '10px', letterSpacing: '2px', color: '#f5c842', marginBottom: '6px', textTransform: 'uppercase' }
const btnP = { padding: '11px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #f5c842, #c8940c)', color: '#0a0600', fontWeight: 700, fontSize: '13px' }
const btnS = { padding: '8px 14px', borderRadius: '8px', border: '1px solid #2e2000', cursor: 'pointer', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: '12px' }
const card = { background: '#1e1500', border: '1px solid #2e2000', borderRadius: '14px', padding: '24px', marginBottom: '20px' }
const title = { color: '#fafafa', fontSize: '16px', fontFamily: 'var(--font-playfair)', marginBottom: '4px' }
const sub = { color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '20px', lineHeight: 1.6 }

function Field({ label, hint, children }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: '6px 0 0' }}>{hint}</p>}
    </div>
  )
}

export default function ContactSettingsClient({ initial }) {
  const [form, setForm] = useState(() => ({
    address: initial?.address ?? '',
    phone: initial?.phone ?? '',
    email: initial?.email ?? '',
    whatsapp: initial?.whatsapp ?? '',
    instagram: initial?.instagram ?? '',
    tiktok: initial?.tiktok ?? '',
    facebook: initial?.facebook ?? '',
    trading_hours: Array.isArray(initial?.trading_hours) && initial.trading_hours.length
      ? initial.trading_hours.map(h => ({ day: h.day || '', hours: h.hours || '' }))
      : [{ day: '', hours: '' }],
  }))
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setSaved(false) }
  const setHour = (i, k, v) => {
    setForm(f => ({ ...f, trading_hours: f.trading_hours.map((h, idx) => idx === i ? { ...h, [k]: v } : h) }))
    setSaved(false)
  }
  const addHour = () => setForm(f => ({ ...f, trading_hours: [...f.trading_hours, { day: '', hours: '' }] }))
  const removeHour = (i) => setForm(f => ({ ...f, trading_hours: f.trading_hours.filter((_, idx) => idx !== i) }))

  function save() {
    startTransition(async () => {
      const result = await saveContactSettings(form)
      if (result?.error) { alert(`Could not save:\n${result.error}`); return }
      setSaved(true)
    })
  }

  return (
    <div style={{ maxWidth: '680px' }}>
      <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '28px', color: '#fafafa', marginBottom: '6px' }}>Find Us</h1>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '28px', lineHeight: 1.6 }}>
        Edit the contact details, trading hours, and social links shown on the public Contact page. Changes go live immediately.
      </p>

      {/* Contact details */}
      <div style={card}>
        <h2 style={title}>Contact Details</h2>
        <p style={sub}>Phone, email and WhatsApp become tap-to-action links on the site.</p>
        <div style={{ display: 'grid', gap: '16px' }}>
          <Field label="Address" hint="Shown on the Contact page and links to Google Maps.">
            <textarea rows={2} style={{ ...inp, resize: 'vertical' }} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Street, area, city, postal code" />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Phone" hint="Tap-to-call. E.g. 061 489 4615">
              <input style={inp} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="061 489 4615" />
            </Field>
            <Field label="WhatsApp Number" hint="International format, e.g. 27614894615">
              <input style={inp} value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} placeholder="27614894615" />
            </Field>
          </div>
          <Field label="Email" hint="Tap-to-email.">
            <input style={inp} value={form.email} onChange={e => set('email', e.target.value)} placeholder="bookings@khulacafe.co.za" />
          </Field>
        </div>
      </div>

      {/* Trading hours */}
      <div style={card}>
        <h2 style={title}>Trading Hours</h2>
        <p style={sub}>Add a row per day or day-range. Leave empty rows out.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {form.trading_hours.map((h, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', alignItems: 'center' }}>
              <input style={inp} value={h.day} onChange={e => setHour(i, 'day', e.target.value)} placeholder="Monday – Thursday" />
              <input style={inp} value={h.hours} onChange={e => setHour(i, 'hours', e.target.value)} placeholder="08:00 – 21:00" />
              <button onClick={() => removeHour(i)} title="Remove" style={{ ...btnS, padding: '9px 12px' }}>✕</button>
            </div>
          ))}
        </div>
        <button onClick={addHour} style={{ ...btnS, marginTop: '12px' }}>+ Add row</button>
      </div>

      {/* Socials */}
      <div style={card}>
        <h2 style={title}>Social Media</h2>
        <p style={sub}>Enter the handle (e.g. <strong>khulacafe</strong>) or a full profile URL. Leave blank to hide an icon.</p>
        <div style={{ display: 'grid', gap: '16px' }}>
          <Field label="Instagram"><input style={inp} value={form.instagram} onChange={e => set('instagram', e.target.value)} placeholder="khulacafe" /></Field>
          <Field label="TikTok"><input style={inp} value={form.tiktok} onChange={e => set('tiktok', e.target.value)} placeholder="khulacafe" /></Field>
          <Field label="Facebook"><input style={inp} value={form.facebook} onChange={e => set('facebook', e.target.value)} placeholder="khulacafe" /></Field>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button onClick={save} disabled={isPending} style={btnP}>{isPending ? 'Saving…' : 'Save Changes'}</button>
        {saved && <span style={{ color: '#26de81', fontSize: '13px' }}>✓ Saved — live on the Contact page</span>}
      </div>
    </div>
  )
}
