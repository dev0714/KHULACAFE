'use client'
import { useState, useEffect, useTransition, useCallback } from 'react'
import { supabase } from '../../../lib/supabase-public'
import { upsertOccasion, deleteOccasion, upsertAddon, deleteAddon } from '../actions'

const inputStyle = { width: '100%', padding: '10px 14px', background: '#0a0600', border: '1px solid #2e2000', borderRadius: '8px', color: '#fafafa', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }
const labelStyle = { display: 'block', fontSize: '10px', letterSpacing: '2px', color: '#f5c842', marginBottom: '6px', textTransform: 'uppercase' }

export default function BookingsAdmin() {
  const [occasions, setOccasions] = useState([])
  const [addons, setAddons] = useState([])
  const [occForm, setOccForm] = useState({ label: '', emoji: '🎉', description: '' })
  const [addonForm, setAddonForm] = useState({ label: '', icon: '🎁', price_cents: 0 })
  const [editOcc, setEditOcc] = useState(null)
  const [editAddon, setEditAddon] = useState(null)
  const [isPending, startTransition] = useTransition()

  const loadOccasions = useCallback(async () => {
    const { data } = await supabase.from('booking_occasions').select('*').order('sort_order')
    setOccasions(data || [])
  }, [])

  const loadAddons = useCallback(async () => {
    const { data } = await supabase.from('booking_addons').select('*').order('sort_order')
    setAddons(data || [])
  }, [])

  useEffect(() => { loadOccasions(); loadAddons() }, [loadOccasions, loadAddons])

  function saveOcc() {
    startTransition(async () => {
      const payload = { ...occForm, sort_order: editOcc ? editOcc.sort_order : occasions.length }
      if (editOcc) payload.id = editOcc.id
      await upsertOccasion(payload)
      setOccForm({ label: '', emoji: '🎉', description: '' })
      setEditOcc(null)
      await loadOccasions()
    })
  }

  function removeOcc(id) {
    if (!confirm('Delete occasion?')) return
    startTransition(async () => { await deleteOccasion(id); await loadOccasions() })
  }

  function saveAddon() {
    startTransition(async () => {
      const payload = { ...addonForm, sort_order: editAddon ? editAddon.sort_order : addons.length }
      if (editAddon) payload.id = editAddon.id
      await upsertAddon(payload)
      setAddonForm({ label: '', icon: '🎁', price_cents: 0 })
      setEditAddon(null)
      await loadAddons()
    })
  }

  function removeAddon(id) {
    if (!confirm('Delete add-on?')) return
    startTransition(async () => { await deleteAddon(id); await loadAddons() })
  }

  return (
    <>
      <h1 style={{ fontFamily: 'var(--font-playfair)', color: '#fafafa', fontSize: '28px', marginBottom: '32px' }}>Booking Options</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        {/* Occasions */}
        <div style={{ background: '#1e1500', border: '1px solid #2e2000', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ color: '#f5c842', fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' }}>What's the Occasion?</h2>
          {occasions.map(o => (
            <div key={o.id} style={{ padding: '10px 12px', background: '#0a0600', borderRadius: '8px', border: '1px solid #2e2000', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#fafafa', fontSize: '13px' }}>{o.emoji} {o.label}</span>
              <div>
                <button onClick={() => { setEditOcc(o); setOccForm({ label: o.label, emoji: o.emoji, description: o.description || '' }) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', marginRight: '4px' }}>✏️</button>
                <button onClick={() => removeOcc(o.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px' }}>🗑️</button>
              </div>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #2e2000', paddingTop: '14px', marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ color: '#f5c842', fontSize: '10px', letterSpacing: '2px' }}>{editOcc ? 'EDIT' : 'ADD'}</p>
            <div><label style={labelStyle}>Label</label><input value={occForm.label} onChange={e => setOccForm(f => ({ ...f, label: e.target.value }))} placeholder="e.g. Birthday" style={inputStyle} /></div>
            <div><label style={labelStyle}>Emoji</label><input value={occForm.emoji} onChange={e => setOccForm(f => ({ ...f, emoji: e.target.value }))} style={inputStyle} /></div>
            <div><label style={labelStyle}>Description</label><input value={occForm.description} onChange={e => setOccForm(f => ({ ...f, description: e.target.value }))} style={inputStyle} /></div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={saveOcc} disabled={isPending || !occForm.label} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #f5c842, #c8940c)', color: '#0a0600', fontWeight: 700, fontSize: '12px' }}>{isPending ? '…' : editOcc ? 'Update' : 'Add'}</button>
              {editOcc && <button onClick={() => { setEditOcc(null); setOccForm({ label: '', emoji: '🎉', description: '' }) }} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: '#2e2000', color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>Cancel</button>}
            </div>
          </div>
        </div>

        {/* Add-ons */}
        <div style={{ background: '#1e1500', border: '1px solid #2e2000', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ color: '#f5c842', fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' }}>Add-Ons (Optional)</h2>
          {addons.map(a => (
            <div key={a.id} style={{ padding: '10px 12px', background: '#0a0600', borderRadius: '8px', border: '1px solid #2e2000', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#fafafa', fontSize: '13px' }}>{a.icon} {a.label} <span style={{ color: 'rgba(255,255,255,0.4)' }}>R{(a.price_cents / 100).toFixed(2)}</span></span>
              <div>
                <button onClick={() => { setEditAddon(a); setAddonForm({ label: a.label, icon: a.icon, price_cents: a.price_cents }) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', marginRight: '4px' }}>✏️</button>
                <button onClick={() => removeAddon(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px' }}>🗑️</button>
              </div>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #2e2000', paddingTop: '14px', marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ color: '#f5c842', fontSize: '10px', letterSpacing: '2px' }}>{editAddon ? 'EDIT' : 'ADD'}</p>
            <div><label style={labelStyle}>Label</label><input value={addonForm.label} onChange={e => setAddonForm(f => ({ ...f, label: e.target.value }))} placeholder="e.g. Balloon Arch" style={inputStyle} /></div>
            <div><label style={labelStyle}>Icon</label><input value={addonForm.icon} onChange={e => setAddonForm(f => ({ ...f, icon: e.target.value }))} style={inputStyle} /></div>
            <div>
              <label style={labelStyle}>Price (R) — 0 = free</label>
              <input type="number" min="0" step="0.01" value={(addonForm.price_cents / 100).toFixed(2)}
                onChange={e => setAddonForm(f => ({ ...f, price_cents: Math.round(parseFloat(e.target.value || 0) * 100) }))}
                style={inputStyle} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={saveAddon} disabled={isPending || !addonForm.label} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #f5c842, #c8940c)', color: '#0a0600', fontWeight: 700, fontSize: '12px' }}>{isPending ? '…' : editAddon ? 'Update' : 'Add'}</button>
              {editAddon && <button onClick={() => { setEditAddon(null); setAddonForm({ label: '', icon: '🎁', price_cents: 0 }) }} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: '#2e2000', color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>Cancel</button>}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
