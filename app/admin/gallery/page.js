'use client'
import { useState, useEffect, useTransition, useCallback } from 'react'
import { supabase } from '../../../lib/supabase-public'
import { upsertGalleryItem, deleteGalleryItem } from '../actions'
import ImageUpload from '../../../components/admin/ImageUpload'

const inputStyle = { width: '100%', padding: '10px 14px', background: '#0a0600', border: '1px solid #2e2000', borderRadius: '8px', color: '#fafafa', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }
const labelStyle = { display: 'block', fontSize: '10px', letterSpacing: '2px', color: '#f5c842', marginBottom: '6px', textTransform: 'uppercase' }

export default function GalleryAdmin() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ label: '', icon: '📸', image_url: '' })
  const [editing, setEditing] = useState(null)
  const [tab, setTab] = useState('gallery')
  const [isPending, startTransition] = useTransition()

  const load = useCallback(async () => {
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
        {['gallery', 'atmosphere'].map(t => (
          <button key={t} onClick={() => { setTab(t); setEditing(null); setForm({ label: '', icon: '📸', image_url: '' }) }} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: tab === t ? 'linear-gradient(135deg, #f5c842, #c8940c)' : '#2e2000', color: tab === t ? '#0a0600' : 'rgba(255,255,255,0.6)', fontWeight: tab === t ? 700 : 400, fontSize: '12px', letterSpacing: '1px' }}>
            {t === 'gallery' ? '📸 Gallery' : '🏛️ Home Atmosphere'}
          </button>
        ))}
      </div>

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
          <div><label style={labelStyle}>Image</label><ImageUpload value={form.image_url} onChange={url => setForm(f => ({ ...f, image_url: url }))} folder="gallery" /></div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button onClick={save} disabled={isPending || !form.label} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #f5c842, #c8940c)', color: '#0a0600', fontWeight: 700, fontSize: '12px' }}>{isPending ? '…' : editing ? 'Update' : 'Add'}</button>
            {editing && <button onClick={() => { setEditing(null); setForm({ label: '', icon: '📸', image_url: '' }) }} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: '#2e2000', color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>Cancel</button>}
          </div>
        </div>
      </div>
    </>
  )
}
