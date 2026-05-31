'use client'
import { useState, useEffect, useTransition, useCallback } from 'react'
import { supabase } from '../../../lib/supabase-public'
import { upsertGalleryItem, deleteGalleryItem, getAboutImages, updateAboutImage } from '../actions'
import ImageUpload from '../../../components/admin/ImageUpload'

const inputStyle = { width: '100%', padding: '10px 14px', background: '#0a0600', border: '1px solid #2e2000', borderRadius: '8px', color: '#fafafa', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }
const labelStyle = { display: 'block', fontSize: '10px', letterSpacing: '2px', color: '#f5c842', marginBottom: '6px', textTransform: 'uppercase' }

const ABOUT_SLOTS = [
  { key: 'main',         label: 'Main Photo (large)',   hint: 'Tall banner — shown full width on the right', aspect: 3/4 },
  { key: 'bottom_left',  label: 'Bottom Left Photo',    hint: 'Smaller square, bottom-left',                aspect: 1 },
  { key: 'bottom_right', label: 'Bottom Right Photo',   hint: 'Smaller square, bottom-right',               aspect: 1 },
]

function AboutPhotosTab() {
  const [images, setImages] = useState({})
  const [saving, setSaving] = useState({})
  const [success, setSuccess] = useState({})

  useEffect(() => {
    getAboutImages().then(setImages)
  }, [])

  async function handleSave(slot, url) {
    setSaving(s => ({ ...s, [slot]: true }))
    await updateAboutImage(slot, url)
    setImages(m => ({ ...m, [slot]: url }))
    setSuccess(s => ({ ...s, [slot]: true }))
    setTimeout(() => setSuccess(s => ({ ...s, [slot]: false })), 3000)
    setSaving(s => ({ ...s, [slot]: false }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '520px' }}>
      {ABOUT_SLOTS.map((slot) => {
        const { key, label, hint } = slot
        return (
        <div key={key} style={{ background: '#1e1500', border: '1px solid #2e2000', borderRadius: '12px', padding: '20px' }}>
          <p style={{ color: '#f5c842', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', marginBottom: '14px' }}>{hint}</p>

          {images[key] && (
            <img src={images[key]} alt={label} style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px', border: '1px solid #2e2000' }} />
          )}

          <ImageUpload
            value={images[key] || ''}
            onChange={url => setImages(m => ({ ...m, [key]: url }))}
            folder="about"
            aspect={slot.aspect}
          />

          <button
            onClick={() => handleSave(key, images[key] || null)}
            disabled={saving[key]}
            style={{
              marginTop: '12px', padding: '10px 20px', borderRadius: '8px', border: 'none',
              background: saving[key] ? '#2e2000' : 'linear-gradient(135deg, #f5c842, #c8940c)',
              color: saving[key] ? 'rgba(255,255,255,0.4)' : '#0a0600',
              fontWeight: 700, fontSize: '11px', letterSpacing: '1px', cursor: saving[key] ? 'not-allowed' : 'pointer',
            }}
          >
            {saving[key] ? 'Saving…' : success[key] ? '✓ Saved' : 'Save Photo'}
          </button>
        </div>
        )
      })}
    </div>
  )
}

export default function GalleryAdmin() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ label: '', icon: '📸', image_url: '' })
  const [editing, setEditing] = useState(null)
  const [tab, setTab] = useState('gallery')
  const [isPending, startTransition] = useTransition()

  const load = useCallback(async () => {
    if (tab === 'about') return
    const { data } = await supabase.from('gallery_items').select('*').eq('is_atmosphere', tab === 'atmosphere').order('sort_order')
    setItems(data || [])
  }, [tab])

  useEffect(() => { load() }, [load])

  function save() {
    startTransition(async () => {
      const payload = { ...form, is_atmosphere: tab === 'atmosphere', sort_order: editing ? editing.sort_order : items.length }
      if (editing) payload.id = editing.id
      await upsertGalleryItem(payload)
      setForm({ label: '', icon: '📸', image_url: '' })
      setEditing(null)
      await load()
    })
  }

  function remove(id) {
    if (!confirm('Delete this item?')) return
    startTransition(async () => { await deleteGalleryItem(id); await load() })
  }

  return (
    <>
      <h1 style={{ fontFamily: 'var(--font-playfair)', color: '#fafafa', fontSize: '28px', marginBottom: '24px' }}>Gallery & Atmosphere</h1>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
        {[
          { key: 'gallery',    label: '📸 Gallery' },
          { key: 'atmosphere', label: '🏛️ Home Atmosphere' },
          { key: 'about',      label: '🖼️ About Photos' },
        ].map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setEditing(null); setForm({ label: '', icon: '📸', image_url: '' }) }} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: tab === t.key ? 'linear-gradient(135deg, #f5c842, #c8940c)' : '#2e2000', color: tab === t.key ? '#0a0600' : 'rgba(255,255,255,0.6)', fontWeight: tab === t.key ? 700 : 400, fontSize: '12px', letterSpacing: '1px' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'about' ? <AboutPhotosTab /> : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px', marginBottom: '32px' }}>
            {items.map(item => (
              <div key={item.id} style={{ background: '#1e1500', border: '1px solid #2e2000', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ height: '120px', background: '#0a0600', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>
                  {item.image_url ? <img src={item.image_url} alt={item.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : item.icon}
                </div>
                <div style={{ padding: '10px 12px' }}>
                  <p style={{ color: '#fafafa', fontSize: '12px', marginBottom: '8px' }}>{item.label}</p>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => { setEditing(item); setForm({ label: item.label, icon: item.icon, image_url: item.image_url || '' }) }} style={{ flex: 1, padding: '5px', background: '#2e2000', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#f5c842', fontSize: '11px' }}>Edit</button>
                    <button onClick={() => remove(item.id)} style={{ flex: 1, padding: '5px', background: 'none', border: '1px solid #2e2000', borderRadius: '6px', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: '#1e1500', border: '1px solid #2e2000', borderRadius: '12px', padding: '24px', maxWidth: '440px' }}>
            <p style={{ color: '#f5c842', fontSize: '10px', letterSpacing: '2px', marginBottom: '14px' }}>{editing ? 'EDIT ITEM' : 'ADD ITEM'}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div><label style={labelStyle}>Label</label><input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} style={inputStyle} /></div>
              <div><label style={labelStyle}>Fallback Icon</label><input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} style={inputStyle} /></div>
              <div><label style={labelStyle}>Image</label><ImageUpload value={form.image_url} onChange={url => setForm(f => ({ ...f, image_url: url }))} folder="gallery" aspect={4/3} /></div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button onClick={save} disabled={isPending || !form.label} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #f5c842, #c8940c)', color: '#0a0600', fontWeight: 700, fontSize: '12px' }}>{isPending ? '…' : editing ? 'Update' : 'Add'}</button>
                {editing && <button onClick={() => { setEditing(null); setForm({ label: '', icon: '📸', image_url: '' }) }} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: '#2e2000', color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>Cancel</button>}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
