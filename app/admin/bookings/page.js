'use client'
import { useState, useEffect, useTransition, useCallback } from 'react'
import { supabase } from '../../../lib/supabase-public'
import { upsertOccasion, deleteOccasion, upsertAddon, deleteAddon, seedOccasions } from '../actions'
import ImageUpload from '../../../components/admin/ImageUpload'
import { PageHeader, Card, Pill, Btn, Tabs, Icon, Empty } from '../../../components/admin/ui'

const EMPTY_ADDON = { label: '', icon: '🎁', price_cents: 0, description: '', images: [], colors: [] }
const EMPTY_OCC = { label: '', emoji: '🎉', description: '', price_cents: 10000, category: 'Special Occasion' }
const CATEGORIES = ['Romantic', 'Business', 'Special Occasion']

const STATUS = {
  pending:   { label: 'Pending',   color: '#f5c842' },
  confirmed: { label: 'Confirmed', color: '#26de81' },
  cancelled: { label: 'Cancelled', color: '#ff6b6b' },
  completed: { label: 'Completed', color: 'rgba(255,255,255,0.45)' },
}

function Field({ label, children, span }) {
  return <div style={span ? { gridColumn: '1/-1' } : undefined}><label className="adm-label">{label}</label>{children}</div>
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function BookingsAdmin() {
  const [tab, setTab] = useState('bookings')
  const [occasions, setOccasions] = useState([])
  const [addons, setAddons] = useState([])
  const [bookings, setBookings] = useState([])
  const [bookingFilter, setBookingFilter] = useState('all')
  const [search, setSearch] = useState('')

  const [occForm, setOccForm] = useState(EMPTY_OCC)
  const [addonForm, setAddonForm] = useState(EMPTY_ADDON)
  const [newColor, setNewColor] = useState('')
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
  const loadBookings = useCallback(async () => {
    const { data } = await supabase
      .from('bookings')
      .select('*, booking_occasions(label, emoji)')
      .order('date', { ascending: false })
      .order('time', { ascending: false })
    setBookings(data || [])
  }, [])

  useEffect(() => { loadOccasions(); loadAddons(); loadBookings() }, [loadOccasions, loadAddons, loadBookings])

  // ── Occasions ──
  function saveOcc() {
    startTransition(async () => {
      const payload = { ...occForm, sort_order: editOcc ? editOcc.sort_order : occasions.length }
      if (editOcc) payload.id = editOcc.id
      const result = await upsertOccasion(payload)
      if (result?.error) { alert(`Could not save occasion:\n${result.error}`); return }
      if (result?.warning) alert(result.warning)
      setOccForm(EMPTY_OCC); setEditOcc(null)
      await loadOccasions()
    })
  }
  function removeOcc(id) {
    if (!confirm('Delete this occasion?')) return
    startTransition(async () => {
      const result = await deleteOccasion(id)
      if (result?.error) { alert(`Could not delete occasion:\n${result.error}`); return }
      await loadOccasions()
    })
  }
  function editOccStart(o) {
    setEditOcc(o)
    setOccForm({ label: o.label, emoji: o.emoji, description: o.description || '', price_cents: o.price_cents || 10000, category: o.category || 'Special Occasion' })
  }

  // ── Add-ons ──
  function saveAddon() {
    startTransition(async () => {
      const payload = {
        ...addonForm,
        images: Array.isArray(addonForm.images) ? addonForm.images : [],
        colors: Array.isArray(addonForm.colors) ? addonForm.colors : [],
        sort_order: editAddon ? editAddon.sort_order : addons.length,
      }
      if (editAddon) payload.id = editAddon.id
      const result = await upsertAddon(payload)
      if (result?.error) { alert(`Could not save add-on:\n${result.error}`); return }
      setAddonForm(EMPTY_ADDON); setNewColor(''); setEditAddon(null)
      await loadAddons()
    })
  }
  function editAddonStart(a) {
    setEditAddon(a)
    setAddonForm({
      label: a.label, icon: a.icon, price_cents: a.price_cents, description: a.description || '',
      images: Array.isArray(a.images) ? a.images : [], colors: Array.isArray(a.colors) ? a.colors : [],
    })
    setNewColor('')
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  function addColor() {
    const c = newColor.trim()
    if (!c) return
    setAddonForm(f => ({ ...f, colors: [...(f.colors || []), c] }))
    setNewColor('')
  }
  const removeColor = (i) => setAddonForm(f => ({ ...f, colors: (f.colors || []).filter((_, idx) => idx !== i) }))
  const addImage = (url) => { if (url) setAddonForm(f => ({ ...f, images: [...(f.images || []), url] })) }
  const removeImage = (i) => setAddonForm(f => ({ ...f, images: (f.images || []).filter((_, idx) => idx !== i) }))
  function removeAddon(id) {
    if (!confirm('Delete this add-on?')) return
    startTransition(async () => { await deleteAddon(id); await loadAddons() })
  }

  // ── Bookings ──
  async function updateBookingStatus(id, status) {
    await supabase.from('bookings').update({ status }).eq('id', id)
    await loadBookings()
  }

  const counts = bookings.reduce((a, b) => { a[b.status] = (a[b.status] || 0) + 1; return a }, {})
  const filtered = bookings.filter(b => {
    if (bookingFilter !== 'all' && b.status !== bookingFilter) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return b.customer_name?.toLowerCase().includes(q) || b.reference?.toLowerCase().includes(q) || b.customer_email?.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <>
      <PageHeader
        title="Bookings"
        subtitle="Reservations, occasions and event add-ons in one place."
        actions={tab === 'bookings' && <Btn onClick={loadBookings}>{Icon.refresh(16)} Refresh</Btn>}
      />

      <div style={{ marginBottom: '20px' }}>
        <Tabs value={tab} onChange={setTab} items={[
          { key: 'bookings', label: 'Bookings', count: bookings.length },
          { key: 'occasions', label: 'Occasions', count: occasions.length },
          { key: 'addons', label: 'Add-ons', count: addons.length },
        ]} />
      </div>

      {/* ── BOOKINGS ── */}
      {tab === 'bookings' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <Tabs value={bookingFilter} onChange={setBookingFilter} items={[
              { key: 'all', label: 'All', count: bookings.length },
              { key: 'pending', label: 'Pending', count: counts.pending || 0 },
              { key: 'confirmed', label: 'Confirmed', count: counts.confirmed || 0 },
              { key: 'completed', label: 'Completed', count: counts.completed || 0 },
              { key: 'cancelled', label: 'Cancelled', count: counts.cancelled || 0 },
            ]} />
            <div className="adm-search" style={{ width: '260px' }}>
              <span className="adm-search-ico">{Icon.search(16)}</span>
              <input className="adm-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or reference…" />
            </div>
          </div>

          {filtered.length === 0 ? <Card><Empty>No bookings here yet.</Empty></Card> : (
            <div className="adm-stagger" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filtered.map(b => {
                const st = STATUS[b.status] || STATUS.pending
                const addOns = Array.isArray(b.add_ons) ? b.add_ons : []
                return (
                  <Card key={b.id} className="hover" style={{ padding: '18px 22px', display: 'grid', gridTemplateColumns: '110px minmax(0,1.2fr) minmax(0,1.2fr) minmax(0,1.1fr) auto', gap: '18px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '12px', color: 'var(--adm-faint)' }}>{fmtDate(b.date)}</span>
                      <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '20px', fontWeight: 700 }}>{b.time}</span>
                      <span style={{ fontSize: '11px', color: 'var(--adm-faint)' }}>{b.guests} guests</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 }}>
                      <span style={{ fontSize: '14px', fontWeight: 600 }}>{b.customer_name}</span>
                      <span style={{ fontSize: '12px', color: 'var(--adm-gold)', fontWeight: 600 }}>
                        {b.booking_occasions?.emoji} {b.booking_occasions?.label || 'Occasion'}{b.occasion_reason ? ` · ${b.occasion_reason}` : ''}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--adm-faint)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {b.customer_email || ''}{b.customer_email && b.customer_phone ? ' · ' : ''}{b.customer_phone || ''}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--adm-faint)', letterSpacing: '1px' }}>REF {b.reference}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 }}>
                      <span className="adm-th">Add-ons</span>
                      <span style={{ fontSize: '12px', color: 'var(--adm-muted)' }}>{addOns.length ? addOns.map(a => a.color ? `${a.label} (${a.color})` : a.label).join(', ') : '—'}</span>
                      {b.special_song && <span style={{ fontSize: '11px', color: 'var(--adm-faint)' }}>Song: {b.special_song}</span>}
                      {b.special_request && <span style={{ fontSize: '11px', color: 'var(--adm-faint)', fontStyle: 'italic' }}>“{b.special_request}”</span>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 }}>
                      <span className="adm-th">Payment</span>
                      <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '18px', fontWeight: 700, color: 'var(--adm-gold)' }}>R{(b.deposit_cents / 100).toFixed(0)} <span style={{ fontFamily: 'var(--font-poppins)', fontSize: '11px', color: 'var(--adm-faint)', fontWeight: 400 }}>deposit</span></span>
                      {b.payment_note && <span style={{ fontSize: '11px', color: 'var(--adm-muted)' }}>{b.payment_note}</span>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <Pill color={st.color}>{st.label}</Pill>
                      <select value={b.status} onChange={e => updateBookingStatus(b.id, e.target.value)} className="adm-input" style={{ width: 'auto', height: '34px', fontSize: '12px', cursor: 'pointer' }}>
                        {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── OCCASIONS ── */}
      {tab === 'occasions' && (
        <div className="admin-chart-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '16px', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <p style={{ color: 'var(--adm-muted)', fontSize: '13px', margin: 0 }}>Occasions appear on the booking form grouped by category, each with its own deposit.</p>
              <Btn className="adm-btn-sm" disabled={isPending} onClick={() => {
                if (!confirm('This will replace ALL current occasions with the default set. Continue?')) return
                startTransition(async () => {
                  const result = await seedOccasions()
                  if (result?.error) { alert(`Could not load defaults:\n${result.error}`); return }
                  if (result?.warning) alert(result.warning)
                  await loadOccasions()
                })
              }}>{Icon.refresh(14)} Load defaults</Btn>
            </div>
            {[...CATEGORIES, null].map(cat => {
              const items = cat
                ? occasions.filter(o => (o.category || 'Special Occasion') === cat)
                : occasions.filter(o => !CATEGORIES.includes(o.category) && o.category)
              if (items.length === 0) return null
              return (
                <Card key={cat || 'other'} style={{ overflow: 'hidden' }}>
                  <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--adm-border)' }}><span className="adm-th">{cat || 'Other'}</span></div>
                  {items.map(o => (
                    <div key={o.id} className="adm-table-row adm-row" style={{ gridTemplateColumns: 'minmax(0,1fr) 70px auto', padding: '12px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                        <span style={{ fontSize: '20px', width: '28px', textAlign: 'center' }}>{o.emoji}</span>
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                          <span style={{ fontSize: '13px', fontWeight: 500 }}>{o.label}</span>
                          {o.description && <span style={{ fontSize: '12px', color: 'var(--adm-faint)' }}>{o.description}</span>}
                        </div>
                      </div>
                      <span style={{ color: 'var(--adm-gold)', fontSize: '13px', fontWeight: 700 }}>R{((o.price_cents || 0) / 100).toFixed(0)}</span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="adm-iconbtn" style={{ width: '32px', height: '32px' }} onClick={() => editOccStart(o)} title="Edit">{Icon.edit(14)}</button>
                        <button className="adm-iconbtn" style={{ width: '32px', height: '32px', color: 'var(--adm-red)' }} onClick={() => removeOcc(o.id)} title="Delete">{Icon.trash(14)}</button>
                      </div>
                    </div>
                  ))}
                </Card>
              )
            })}
            {occasions.length === 0 && <Card><Empty>No occasions yet — add one or load the defaults.</Empty></Card>}
          </div>

          <Card style={{ padding: '22px', position: 'sticky', top: '84px' }}>
            <p className="adm-th" style={{ marginBottom: '16px' }}>{editOcc ? 'Edit occasion' : 'New occasion'}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <Field label="Label" span><input className="adm-input" value={occForm.label} onChange={e => setOccForm(f => ({ ...f, label: e.target.value }))} placeholder="e.g. Birthday Celebration" /></Field>
              <Field label="Emoji"><input className="adm-input" value={occForm.emoji} onChange={e => setOccForm(f => ({ ...f, emoji: e.target.value }))} /></Field>
              <Field label="Deposit (R)"><input className="adm-input" type="number" min="0" step="1" value={Math.round((occForm.price_cents || 0) / 100)} onChange={e => setOccForm(f => ({ ...f, price_cents: Math.round(parseFloat(e.target.value || 0) * 100) }))} /></Field>
              <Field label="Category" span>
                <select className="adm-input" value={occForm.category} onChange={e => setOccForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Description" span><input className="adm-input" value={occForm.description} onChange={e => setOccForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description shown to customers" /></Field>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Btn variant="primary" onClick={saveOcc} disabled={isPending || !occForm.label}>{isPending ? 'Saving…' : editOcc ? 'Update occasion' : 'Add occasion'}</Btn>
              {editOcc && <Btn onClick={() => { setEditOcc(null); setOccForm(EMPTY_OCC) }}>Cancel</Btn>}
            </div>
          </Card>
        </div>
      )}

      {/* ── ADD-ONS ── */}
      {tab === 'addons' && (
        <div className="admin-chart-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '16px', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ color: 'var(--adm-muted)', fontSize: '13px', margin: '0 0 6px' }}>Optional extras customers can add to a reservation. Add photos and colour options so they can see and choose. Set price to R0 for complimentary items.</p>
            {addons.length === 0 && <Card><Empty>No add-ons yet.</Empty></Card>}
            {addons.map(a => {
              const imgs = Array.isArray(a.images) ? a.images : []
              const cols = Array.isArray(a.colors) ? a.colors : []
              return (
                <Card key={a.id} className="hover" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {imgs[0]
                    ? <img src={imgs[0]} alt="" style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
                    : <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'var(--adm-page)', border: '1px solid var(--adm-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>{a.icon}</div>}
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>{a.label}</span>
                    {a.description && <span style={{ fontSize: '12px', color: 'var(--adm-muted)' }}>{a.description}</span>}
                    <span style={{ fontSize: '11px', color: 'var(--adm-faint)' }}>
                      {imgs.length ? `${imgs.length} photo${imgs.length > 1 ? 's' : ''}` : 'No photos'}{' · '}{cols.length ? `${cols.length} colour${cols.length > 1 ? 's' : ''}` : 'No colours'}
                    </span>
                  </div>
                  <span style={{ color: a.price_cents === 0 ? 'var(--adm-green)' : 'var(--adm-gold)', fontSize: '14px', fontWeight: 700, flexShrink: 0 }}>{a.price_cents === 0 ? 'Free' : `R${(a.price_cents / 100).toFixed(0)}`}</span>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button className="adm-iconbtn" style={{ width: '32px', height: '32px' }} onClick={() => editAddonStart(a)} title="Edit">{Icon.edit(14)}</button>
                    <button className="adm-iconbtn" style={{ width: '32px', height: '32px', color: 'var(--adm-red)' }} onClick={() => removeAddon(a.id)} title="Delete">{Icon.trash(14)}</button>
                  </div>
                </Card>
              )
            })}
          </div>

          <Card style={{ padding: '22px', position: 'sticky', top: '84px' }}>
            <p className="adm-th" style={{ marginBottom: '16px' }}>{editAddon ? 'Edit add-on' : 'New add-on'}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <Field label="Label" span><input className="adm-input" value={addonForm.label} onChange={e => setAddonForm(f => ({ ...f, label: e.target.value }))} placeholder="e.g. Balloon Arch" /></Field>
              <Field label="Icon (emoji)"><input className="adm-input" value={addonForm.icon} onChange={e => setAddonForm(f => ({ ...f, icon: e.target.value }))} /></Field>
              <Field label="Price (R) — 0 = free"><input className="adm-input" type="number" min="0" step="0.01" value={(addonForm.price_cents / 100).toFixed(2)} onChange={e => setAddonForm(f => ({ ...f, price_cents: Math.round(parseFloat(e.target.value || 0) * 100) }))} /></Field>
              <Field label="Description (optional)" span><input className="adm-input" value={addonForm.description} onChange={e => setAddonForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description shown to customers" /></Field>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label className="adm-label">Colour options</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                {(addonForm.colors || []).map((c, i) => (
                  <span key={i} className="adm-pill" style={{ background: 'var(--adm-surface2)', color: 'var(--adm-text)', paddingRight: '6px' }}>
                    {c}<button onClick={() => removeColor(i)} style={{ background: 'none', border: 'none', color: 'var(--adm-faint)', cursor: 'pointer', display: 'flex', padding: 0 }}>{Icon.x(12)}</button>
                  </span>
                ))}
                {(addonForm.colors || []).length === 0 && <span style={{ fontSize: '12px', color: 'var(--adm-faint)' }}>No colours yet — add some below.</span>}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input className="adm-input" value={newColor} onChange={e => setNewColor(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addColor() } }} placeholder="e.g. Gold" />
                <Btn onClick={addColor}>{Icon.plus(14)} Add</Btn>
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label className="adm-label">Photos</label>
              {(addonForm.images || []).length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))', gap: '8px', marginBottom: '12px' }}>
                  {(addonForm.images || []).map((url, i) => (
                    <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--adm-border)' }}>
                      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button onClick={() => removeImage(i)} style={{ position: 'absolute', top: '4px', right: '4px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(0,0,0,0.65)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{Icon.x(12)}</button>
                    </div>
                  ))}
                </div>
              )}
              <p style={{ fontSize: '11px', color: 'var(--adm-faint)', margin: '0 0 8px' }}>Up to 20 photos — upload one at a time.</p>
              {(addonForm.images || []).length < 20 && <ImageUpload value="" onChange={addImage} folder="addons" />}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <Btn variant="primary" onClick={saveAddon} disabled={isPending || !addonForm.label}>{isPending ? 'Saving…' : editAddon ? 'Update add-on' : 'Add add-on'}</Btn>
              {editAddon && <Btn onClick={() => { setEditAddon(null); setAddonForm(EMPTY_ADDON); setNewColor('') }}>Cancel</Btn>}
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
