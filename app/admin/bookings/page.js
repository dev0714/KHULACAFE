'use client'
import { useState, useEffect, useTransition, useCallback } from 'react'
import { supabase } from '../../../lib/supabase-public'
import { upsertOccasion, deleteOccasion, upsertAddon, deleteAddon } from '../actions'

const inp = { width: '100%', padding: '10px 14px', background: '#0a0600', border: '1px solid #2e2000', borderRadius: '8px', color: '#fafafa', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }
const lbl = { display: 'block', fontSize: '10px', letterSpacing: '2px', color: '#f5c842', marginBottom: '6px', textTransform: 'uppercase' }
const btnP = { padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #f5c842, #c8940c)', color: '#0a0600', fontWeight: 700, fontSize: '12px' }
const btnG = { padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: '#2e2000', color: 'rgba(255,255,255,0.6)', fontSize: '12px' }

const STATUS_COLORS = {
  pending:   { bg: 'rgba(245,200,66,0.1)',  border: 'rgba(245,200,66,0.3)',  text: '#f5c842' },
  confirmed: { bg: 'rgba(38,222,129,0.1)',  border: 'rgba(38,222,129,0.3)',  text: '#26de81' },
  cancelled: { bg: 'rgba(255,107,107,0.1)', border: 'rgba(255,107,107,0.3)', text: '#ff6b6b' },
  completed: { bg: 'rgba(255,255,255,0.05)', border: '#2e2000',              text: 'rgba(255,255,255,0.4)' },
}

export default function BookingsAdmin() {
  const [tab, setTab] = useState('bookings') // 'bookings' | 'occasions' | 'addons'
  const [occasions, setOccasions] = useState([])
  const [addons, setAddons] = useState([])
  const [bookings, setBookings] = useState([])
  const [bookingFilter, setBookingFilter] = useState('all')

  const [occForm, setOccForm] = useState({ label: '', emoji: '🎉', description: '', price_cents: 10000 })
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
  const loadBookings = useCallback(async () => {
    const { data } = await supabase
      .from('bookings')
      .select('*, booking_occasions(label, emoji)')
      .order('date', { ascending: false })
      .order('time', { ascending: false })
    setBookings(data || [])
  }, [])

  useEffect(() => { loadOccasions(); loadAddons(); loadBookings() }, [loadOccasions, loadAddons, loadBookings])

  function saveOcc() {
    startTransition(async () => {
      const payload = { ...occForm, sort_order: editOcc ? editOcc.sort_order : occasions.length }
      if (editOcc) payload.id = editOcc.id
      await upsertOccasion(payload)
      setOccForm({ label: '', emoji: '🎉', description: '', price_cents: 10000 })
      setEditOcc(null)
      await loadOccasions()
    })
  }
  function removeOcc(id) {
    if (!confirm('Delete this occasion?')) return
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
    if (!confirm('Delete this add-on?')) return
    startTransition(async () => { await deleteAddon(id); await loadAddons() })
  }

  async function updateBookingStatus(id, status) {
    await supabase.from('bookings').update({ status }).eq('id', id)
    await loadBookings()
  }

  const filtered = bookingFilter === 'all' ? bookings : bookings.filter(b => b.status === bookingFilter)

  const counts = bookings.reduce((acc, b) => { acc[b.status] = (acc[b.status] || 0) + 1; return acc }, {})

  const tabs = [
    { key: 'bookings', label: `Bookings${bookings.length ? ` (${bookings.length})` : ''}` },
    { key: 'occasions', label: 'Occasions' },
    { key: 'addons', label: 'Add-ons' },
  ]

  return (
    <>
      <h1 style={{ fontFamily: 'var(--font-playfair)', color: '#fafafa', fontSize: '28px', marginBottom: '24px' }}>Reservations</h1>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '4px', background: '#1e1500', borderRadius: '10px', padding: '4px', border: '1px solid #2e2000', marginBottom: '24px', width: 'fit-content' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '9px 22px', borderRadius: '7px', border: 'none', cursor: 'pointer',
            background: tab === t.key ? 'linear-gradient(135deg, #f5c842, #c8940c)' : 'transparent',
            color: tab === t.key ? '#0a0600' : 'rgba(255,255,255,0.5)',
            fontSize: '12px', fontWeight: tab === t.key ? 700 : 400, letterSpacing: '0.5px',
            transition: 'all 0.15s',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── BOOKINGS TAB ── */}
      {tab === 'bookings' && (
        <div>
          {/* Stats row */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {[
              { label: 'All', key: 'all', count: bookings.length },
              { label: 'Pending', key: 'pending', count: counts.pending || 0 },
              { label: 'Confirmed', key: 'confirmed', count: counts.confirmed || 0 },
              { label: 'Cancelled', key: 'cancelled', count: counts.cancelled || 0 },
            ].map(f => (
              <button key={f.key} onClick={() => setBookingFilter(f.key)} style={{
                padding: '8px 18px', borderRadius: '8px', border: `1px solid ${bookingFilter === f.key ? '#f5c842' : '#2e2000'}`,
                background: bookingFilter === f.key ? 'rgba(245,200,66,0.1)' : '#1e1500',
                color: bookingFilter === f.key ? '#f5c842' : 'rgba(255,255,255,0.45)',
                fontSize: '12px', cursor: 'pointer',
              }}>
                {f.label} {f.count > 0 && <span style={{ fontWeight: 700 }}>{f.count}</span>}
              </button>
            ))}
            <button onClick={loadBookings} style={{ marginLeft: 'auto', padding: '8px 14px', borderRadius: '8px', border: '1px solid #2e2000', background: '#1e1500', color: 'rgba(255,255,255,0.4)', fontSize: '12px', cursor: 'pointer' }}>↺ Refresh</button>
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.25)', fontSize: '14px' }}>
              No bookings yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filtered.map(b => {
                const sc = STATUS_COLORS[b.status] || STATUS_COLORS.pending
                const addOnsArr = Array.isArray(b.add_ons) ? b.add_ons : []
                return (
                  <div key={b.id} style={{ background: '#1e1500', border: '1px solid #2e2000', borderRadius: '12px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                          <span style={{ fontFamily: 'var(--font-playfair)', color: '#fafafa', fontSize: '16px', fontWeight: 600 }}>{b.customer_name}</span>
                          <span style={{ fontSize: '10px', letterSpacing: '2px', padding: '3px 8px', borderRadius: '20px', background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text, textTransform: 'uppercase' }}>{b.status}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '8px' }}>
                          <span style={{ color: '#f5c842', fontSize: '13px', fontWeight: 600 }}>
                            {b.booking_occasions?.emoji} {b.booking_occasions?.label || 'Occasion'}
                          </span>
                          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                            📅 {new Date(b.date).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} at {b.time}
                          </span>
                          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>👥 {b.guests} guests</span>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                          {b.customer_email && <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>✉ {b.customer_email}</span>}
                          {b.customer_phone && <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>📞 {b.customer_phone}</span>}
                        </div>
                        {addOnsArr.length > 0 && (
                          <div style={{ marginTop: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                            Add-ons: {addOnsArr.map(a => a.label).join(', ')}
                          </div>
                        )}
                        {b.special_request && (
                          <div style={{ marginTop: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
                            "{b.special_request}"
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ color: '#f5c842', fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-playfair)' }}>
                            R{(b.deposit_cents / 100).toFixed(2)}
                          </div>
                          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '1px' }}>DEPOSIT</div>
                        </div>
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', letterSpacing: '1px' }}>REF: {b.reference}</div>
                        <select
                          value={b.status}
                          onChange={e => updateBookingStatus(b.id, e.target.value)}
                          style={{ ...inp, width: 'auto', fontSize: '11px', padding: '6px 10px', cursor: 'pointer' }}
                        >
                          {['pending', 'confirmed', 'cancelled', 'completed'].map(s => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── OCCASIONS TAB ── */}
      {tab === 'occasions' && (
        <div style={{ maxWidth: '600px' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '20px', lineHeight: 1.6 }}>
            Occasions appear on the booking form for customers to choose from. Set a deposit amount per occasion type.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
            {occasions.map(o => (
              <div key={o.id} style={{ padding: '14px 16px', background: '#1e1500', borderRadius: '10px', border: '1px solid #2e2000', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ color: '#fafafa', fontSize: '14px' }}>{o.emoji} {o.label}</span>
                  {o.description && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '2px 0 0' }}>{o.description}</p>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: '#f5c842', fontSize: '14px', fontWeight: 700 }}>R{((o.price_cents || 0) / 100).toFixed(2)}</span>
                  <button onClick={() => { setEditOcc(o); setOccForm({ label: o.label, emoji: o.emoji, description: o.description || '', price_cents: o.price_cents || 10000 }) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>✏️</button>
                  <button onClick={() => removeOcc(o.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: '#1e1500', border: '1px solid #2e2000', borderRadius: '12px', padding: '20px' }}>
            <p style={{ color: '#f5c842', fontSize: '10px', letterSpacing: '2px', marginBottom: '16px', textTransform: 'uppercase' }}>
              {editOcc ? '✏️ Edit Occasion' : '+ Add Occasion'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Label</label>
                <input value={occForm.label} onChange={e => setOccForm(f => ({ ...f, label: e.target.value }))} placeholder="e.g. Birthday Celebration" style={inp} />
              </div>
              <div>
                <label style={lbl}>Emoji</label>
                <input value={occForm.emoji} onChange={e => setOccForm(f => ({ ...f, emoji: e.target.value }))} style={inp} />
              </div>
              <div>
                <label style={lbl}>Deposit Price (R)</label>
                <input type="number" min="0" step="0.01"
                  value={((occForm.price_cents || 0) / 100).toFixed(2)}
                  onChange={e => setOccForm(f => ({ ...f, price_cents: Math.round(parseFloat(e.target.value || 0) * 100) }))}
                  style={inp} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Description</label>
                <input value={occForm.description} onChange={e => setOccForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description shown to customers" style={inp} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={saveOcc} disabled={isPending || !occForm.label} style={btnP}>{isPending ? '…' : editOcc ? 'Update' : 'Add Occasion'}</button>
              {editOcc && <button onClick={() => { setEditOcc(null); setOccForm({ label: '', emoji: '🎉', description: '', price_cents: 10000 }) }} style={btnG}>Cancel</button>}
            </div>
          </div>
        </div>
      )}

      {/* ── ADD-ONS TAB ── */}
      {tab === 'addons' && (
        <div style={{ maxWidth: '600px' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '20px', lineHeight: 1.6 }}>
            Add-ons are optional extras customers can add to their reservation. Set to R0 for complimentary items.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
            {addons.map(a => (
              <div key={a.id} style={{ padding: '14px 16px', background: '#1e1500', borderRadius: '10px', border: '1px solid #2e2000', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#fafafa', fontSize: '14px' }}>{a.icon} {a.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: a.price_cents === 0 ? '#26de81' : '#f5c842', fontSize: '14px', fontWeight: 700 }}>
                    {a.price_cents === 0 ? 'Free' : `R${(a.price_cents / 100).toFixed(2)}`}
                  </span>
                  <button onClick={() => { setEditAddon(a); setAddonForm({ label: a.label, icon: a.icon, price_cents: a.price_cents }) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>✏️</button>
                  <button onClick={() => removeAddon(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: '#1e1500', border: '1px solid #2e2000', borderRadius: '12px', padding: '20px' }}>
            <p style={{ color: '#f5c842', fontSize: '10px', letterSpacing: '2px', marginBottom: '16px', textTransform: 'uppercase' }}>
              {editAddon ? '✏️ Edit Add-on' : '+ Add Add-on'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Label</label>
                <input value={addonForm.label} onChange={e => setAddonForm(f => ({ ...f, label: e.target.value }))} placeholder="e.g. Balloon Arch" style={inp} />
              </div>
              <div>
                <label style={lbl}>Icon (emoji)</label>
                <input value={addonForm.icon} onChange={e => setAddonForm(f => ({ ...f, icon: e.target.value }))} style={inp} />
              </div>
              <div>
                <label style={lbl}>Price (R) — 0 = free</label>
                <input type="number" min="0" step="0.01"
                  value={(addonForm.price_cents / 100).toFixed(2)}
                  onChange={e => setAddonForm(f => ({ ...f, price_cents: Math.round(parseFloat(e.target.value || 0) * 100) }))}
                  style={inp} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={saveAddon} disabled={isPending || !addonForm.label} style={btnP}>{isPending ? '…' : editAddon ? 'Update' : 'Add Add-on'}</button>
              {editAddon && <button onClick={() => { setEditAddon(null); setAddonForm({ label: '', icon: '🎁', price_cents: 0 }) }} style={btnG}>Cancel</button>}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
