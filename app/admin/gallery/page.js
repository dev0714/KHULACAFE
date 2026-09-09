'use client'
import { useState, useEffect, useTransition, useCallback } from 'react'
import { supabase } from '../../../lib/supabase-public'
import { upsertGalleryItem, deleteGalleryItem, getAboutImages, updateAboutImage } from '../actions'
import ImageUpload from '../../../components/admin/ImageUpload'
import { PageHeader, Card, Btn, Tabs, Icon, Empty } from '../../../components/admin/ui'

const ABOUT_SLOTS = [
  { key: 'main',         label: 'Main photo (large)', hint: 'Tall banner — shown full width on the right.', aspect: 3 / 4 },
  { key: 'bottom_left',  label: 'Bottom left photo',  hint: 'Smaller square, bottom-left.',                aspect: 1 },
  { key: 'bottom_right', label: 'Bottom right photo', hint: 'Smaller square, bottom-right.',               aspect: 1 },
]
const blankForm = { label: '', icon: '📸', image_url: '' }

function AboutPhotosTab() {
  const [images, setImages] = useState({})
  const [saving, setSaving] = useState({})
  const [success, setSuccess] = useState({})

  useEffect(() => { getAboutImages().then(setImages) }, [])

  async function handleSave(slot, url) {
    setSaving(s => ({ ...s, [slot]: true }))
    await updateAboutImage(slot, url)
    setImages(m => ({ ...m, [slot]: url }))
    setSuccess(s => ({ ...s, [slot]: true }))
    setTimeout(() => setSuccess(s => ({ ...s, [slot]: false })), 3000)
    setSaving(s => ({ ...s, [slot]: false }))
  }

  return (
    <div className="adm-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
      {ABOUT_SLOTS.map(slot => (
        <Card key={slot.key} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <p className="adm-th" style={{ marginBottom: '4px' }}>{slot.label}</p>
            <p style={{ color: 'var(--adm-faint)', fontSize: '12px', margin: 0 }}>{slot.hint}</p>
          </div>
          {images[slot.key] && <img src={images[slot.key]} alt={slot.label} style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '10px', border: '1px solid var(--adm-border)' }} />}
          <ImageUpload value={images[slot.key] || ''} onChange={url => setImages(m => ({ ...m, [slot.key]: url }))} folder="about" aspect={slot.aspect} />
          <div><Btn variant="primary" className="adm-btn-sm" onClick={() => handleSave(slot.key, images[slot.key] || null)} disabled={saving[slot.key]}>{saving[slot.key] ? 'Saving…' : success[slot.key] ? '✓ Saved' : 'Save photo'}</Btn></div>
        </Card>
      ))}
    </div>
  )
}

export default function GalleryAdmin() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(blankForm)
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
      setForm(blankForm); setEditing(null)
      await load()
    })
  }
  function remove(id) {
    if (!confirm('Delete this item?')) return
    startTransition(async () => { await deleteGalleryItem(id); await load() })
  }
  function switchTab(k) { setTab(k); setEditing(null); setForm(blankForm) }

  return (
    <>
      <PageHeader
        title="Gallery"
        subtitle="Photos for the public gallery, the home page atmosphere, and the About page."
        actions={tab !== 'about' && <Btn variant="primary" onClick={() => { setEditing(null); setForm(blankForm); document.getElementById('gallery-editor')?.scrollIntoView({ behavior: 'smooth' }) }}>{Icon.plus(16)} Add photo</Btn>}
      />

      <div style={{ marginBottom: '20px' }}>
        <Tabs value={tab} onChange={switchTab} items={[
          { key: 'gallery', label: 'Gallery', count: tab === 'gallery' ? items.length : undefined },
          { key: 'atmosphere', label: 'Home atmosphere', count: tab === 'atmosphere' ? items.length : undefined },
          { key: 'about', label: 'About photos' },
        ]} />
      </div>

      {tab === 'about' ? <AboutPhotosTab /> : (
        <div className="admin-chart-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: '16px', alignItems: 'start' }}>
          {items.length === 0 ? <Card><Empty>No photos in this section yet.</Empty></Card> : (
            <div className="adm-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px' }}>
              {items.map(item => (
                <Card key={item.id} className="hover" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', border: editing?.id === item.id ? '1px solid var(--adm-gold2)' : undefined }}>
                  <div style={{ height: '130px', background: 'var(--adm-page)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
                    {item.image_url ? <img src={item.image_url} alt={item.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : item.icon}
                  </div>
                  <div style={{ padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                    <span style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                      <button type="button" className="adm-iconbtn" style={{ width: '30px', height: '30px', borderRadius: '8px' }} title="Edit" onClick={() => { setEditing(item); setForm({ label: item.label, icon: item.icon, image_url: item.image_url || '' }) }}>{Icon.edit(13)}</button>
                      <button type="button" className="adm-iconbtn" style={{ width: '30px', height: '30px', borderRadius: '8px', color: 'var(--adm-red)' }} title="Delete" onClick={() => remove(item.id)}>{Icon.trash(13)}</button>
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <Card id="gallery-editor" style={{ padding: '22px', position: 'sticky', top: '84px' }}>
            <p className="adm-th" style={{ marginBottom: '16px' }}>{editing ? 'Edit photo' : 'New photo'}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div><label className="adm-label">Label</label><input className="adm-input" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} /></div>
              <div><label className="adm-label">Fallback icon</label><input className="adm-input" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} /></div>
              <div><label className="adm-label">Image</label><ImageUpload value={form.image_url} onChange={url => setForm(f => ({ ...f, image_url: url }))} folder="gallery" aspect={4 / 3} /></div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <Btn variant="primary" onClick={save} disabled={isPending || !form.label}>{isPending ? 'Saving…' : editing ? 'Update photo' : 'Add photo'}</Btn>
                {editing && <Btn onClick={() => { setEditing(null); setForm(blankForm) }}>Cancel</Btn>}
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
