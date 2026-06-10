'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  upsertCustomer, deleteCustomer, setGoldStatus, recordPurchase, redeemBucks,
  getCustomers, getTransactions, getMenuItemsForPOS,
} from '../actions'

const inputStyle = {
  width: '100%', padding: '10px 12px', boxSizing: 'border-box',
  background: '#1e1500', border: '1px solid #2e2000', borderRadius: '8px',
  color: '#fafafa', fontSize: '13px', outline: 'none',
}
const labelStyle = {
  display: 'block', fontSize: '10px', letterSpacing: '2px',
  color: '#f5c842', marginBottom: '6px', textTransform: 'uppercase',
}
const btnPrimary = {
  padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
  background: 'linear-gradient(135deg, #f5c842, #c8940c)',
  color: '#0a0600', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px',
}
const btnDanger = {
  padding: '6px 14px', borderRadius: '6px', border: '1px solid rgba(255,107,107,0.3)',
  background: 'transparent', color: '#ff6b6b', fontSize: '12px', cursor: 'pointer',
}
const btnGhost = {
  padding: '8px 16px', borderRadius: '8px', border: '1px solid #2e2000',
  background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: '12px', cursor: 'pointer',
}

function isBirthdaySoon(dob, days = 30) {
  if (!dob) return false
  const today = new Date()
  const bday = new Date(dob)
  const next = new Date(today.getFullYear(), bday.getMonth(), bday.getDate())
  if (next < today) next.setFullYear(today.getFullYear() + 1)
  return (next - today) / 86400000 <= days
}

function isBirthdayToday(dob) {
  if (!dob) return false
  const today = new Date()
  const bday = new Date(dob)
  return bday.getMonth() === today.getMonth() && bday.getDate() === today.getDate()
}

function CustomerForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', date_of_birth: '', ...initial })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    await upsertCustomer({ ...form, date_of_birth: form.date_of_birth || null })
    setSaving(false)
    onSave()
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <label style={labelStyle}>Name *</label>
        <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} required />
      </div>
      <div>
        <label style={labelStyle}>Email</label>
        <input style={inputStyle} type="email" value={form.email} onChange={e => set('email', e.target.value)} />
      </div>
      <div>
        <label style={labelStyle}>Phone</label>
        <input style={inputStyle} value={form.phone} onChange={e => set('phone', e.target.value)} />
      </div>
      <div>
        <label style={labelStyle}>Date of Birth 🎂</label>
        <input style={inputStyle} type="date" value={form.date_of_birth || ''} onChange={e => set('date_of_birth', e.target.value)} />
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
          Used to send birthday wishes
        </p>
      </div>
      <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
        <button type="submit" style={btnPrimary} disabled={saving}>
          {saving ? 'Saving…' : initial?.id ? 'Update' : 'Add Customer'}
        </button>
        <button type="button" style={btnGhost} onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}

function PurchaseForm({ customer, onDone }) {
  const [categories, setCategories] = useState([])
  const [selectedItem, setSelectedItem] = useState('')
  const [amount, setAmount] = useState('')
  const [discount, setDiscount] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    getMenuItemsForPOS().then(setCategories).catch(() => {})
  }, [])

  const allItems = categories.flatMap(cat =>
    (cat.menu_items ?? []).map(item => ({ ...item, categoryName: cat.name, categoryIcon: cat.icon }))
  )

  function handleItemSelect(e) {
    const itemId = e.target.value
    setSelectedItem(itemId)
    if (!itemId) return
    const item = allItems.find(i => i.id === itemId)
    if (!item) return
    // Use price_cents if available, fall back to parsing price string
    if (item.price_cents) {
      setAmount((item.price_cents / 100).toFixed(2))
    } else if (item.price && item.price !== 'Ask us') {
      const num = parseFloat(item.price.toString().replace(/[^0-9.]/g, ''))
      if (!isNaN(num)) setAmount(num.toFixed(2))
    }
    if (item.name && !notes) setNotes(item.name)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const res = await recordPurchase(customer.id, parseFloat(amount), discount ? parseInt(discount) : 0, notes || null)
    setResult(res)
    setSaving(false)
    setSelectedItem('')
    setAmount('')
    setDiscount('')
    setNotes('')
    onDone()
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {result && (
        <div style={{ padding: '10px 14px', background: 'rgba(245,200,66,0.08)', borderRadius: '8px', border: '1px solid rgba(245,200,66,0.2)', fontSize: '13px', color: '#f5c842' }}>
          +{result.bucksEarned} Khula Bucks earned
        </div>
      )}

      {/* Menu item selector */}
      <div>
        <label style={labelStyle}>Menu Item (optional)</label>
        <select
          style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
          value={selectedItem}
          onChange={handleItemSelect}
        >
          <option value="">— Select item or enter custom amount —</option>
          {categories.map(cat => (
            <optgroup key={cat.id} label={`${cat.icon} ${cat.name}`}>
              {(cat.menu_items ?? []).map(item => (
                <option key={item.id} value={item.id}>
                  {item.name}{item.price && item.price !== 'Ask us' ? ` — ${item.price}` : ''}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div>
          <label style={labelStyle}>Amount (R) *</label>
          <input
            style={inputStyle} type="number" min="0" step="0.01"
            value={amount} onChange={e => setAmount(e.target.value)} required
            placeholder="0.00"
          />
        </div>
        <div>
          <label style={labelStyle}>Discount %</label>
          <input
            style={inputStyle} type="number" min="0" max="100"
            value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0"
          />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Notes</label>
        <input style={inputStyle} value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Bunny Chow + drinks" />
      </div>

      <button type="submit" style={btnPrimary} disabled={saving || !amount}>
        {saving ? 'Recording…' : 'Record Purchase'}
      </button>
    </form>
  )
}

function RedeemForm({ customer, onDone }) {
  const [bucks, setBucks] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await redeemBucks(customer.id, parseInt(bucks), notes || null)
      setBucks('')
      setNotes('')
      onDone()
    } catch (err) {
      setError(err.message)
    }
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {error && (
        <p style={{ color: '#ff6b6b', fontSize: '12px', margin: 0 }}>{error}</p>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div>
          <label style={labelStyle}>Bucks to Redeem *</label>
          <input style={inputStyle} type="number" min="1" max={customer.khula_bucks} value={bucks} onChange={e => setBucks(e.target.value)} required />
        </div>
        <div>
          <label style={labelStyle}>Notes</label>
          <input style={inputStyle} value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
      </div>
      <button type="submit" style={btnPrimary} disabled={saving || !bucks}>
        {saving ? 'Redeeming…' : 'Redeem Bucks'}
      </button>
    </form>
  )
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [transactions, setTransactions] = useState([])
  const [selected, setSelected] = useState(null)
  const [mode, setMode] = useState('list') // 'list' | 'add' | 'edit' | 'detail'
  const [activeTab, setActiveTab] = useState('purchase') // 'purchase' | 'redeem' | 'history'
  const [search, setSearch] = useState('')

  const loadCustomers = useCallback(async () => {
    const data = await getCustomers()
    setCustomers(data)
  }, [])

  const loadTransactions = useCallback(async (customerId) => {
    const data = await getTransactions(customerId)
    setTransactions(data)
  }, [])

  useEffect(() => { loadCustomers() }, [loadCustomers])

  useEffect(() => {
    if (selected) loadTransactions(selected.id)
  }, [selected, loadTransactions])

  async function handleSelect(c) {
    setSelected(c)
    setMode('detail')
    setActiveTab('purchase')
  }

  async function handleDelete(id) {
    if (!confirm('Delete this customer? All transaction history will be lost.')) return
    await deleteCustomer(id)
    if (selected?.id === id) { setSelected(null); setMode('list') }
    loadCustomers()
  }

  async function handleGoldToggle(c) {
    await setGoldStatus(c.id, !c.is_gold)
    await loadCustomers()
    if (selected?.id === c.id) {
      setSelected(prev => ({ ...prev, is_gold: !prev.is_gold }))
    }
  }

  async function handleActionDone() {
    const [all] = await Promise.all([
      getCustomers(),
      selected ? loadTransactions(selected.id) : Promise.resolve(),
    ])
    setCustomers(all)
    if (selected) {
      const refreshed = all.find(c => c.id === selected.id)
      if (refreshed) setSelected(refreshed)
    }
  }

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  )

  return (
    <div style={{ display: 'flex', gap: '24px', height: '100%', minHeight: 'calc(100vh - 80px)' }}>

      {/* LEFT — Customer List */}
      <div style={{ width: '320px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontFamily: 'var(--font-playfair)', color: '#fafafa', fontSize: '24px', margin: 0 }}>
            Customers
          </h1>
          <button style={btnPrimary} onClick={() => setMode('add')}>+ Add</button>
        </div>

        <input
          style={inputStyle}
          placeholder="Search name, email, phone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {mode === 'add' && (
          <div style={{ background: '#1e1500', border: '1px solid #2e2000', borderRadius: '12px', padding: '20px' }}>
            <p style={{ fontSize: '10px', letterSpacing: '3px', color: '#f5c842', textTransform: 'uppercase', marginBottom: '16px' }}>
              New Customer
            </p>
            <CustomerForm
              initial={{ name: '', email: '', phone: '' }}
              onSave={() => { loadCustomers(); setMode('list') }}
              onCancel={() => setMode('list')}
            />
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
          {filtered.length === 0 && (
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', textAlign: 'center', padding: '32px 0' }}>
              {search ? 'No results' : 'No customers yet'}
            </p>
          )}
          {filtered.map(c => (
            <div
              key={c.id}
              onClick={() => handleSelect(c)}
              style={{
                background: selected?.id === c.id ? '#2e2000' : '#1e1500',
                border: `1px solid ${selected?.id === c.id ? '#f5c842' : '#2e2000'}`,
                borderRadius: '10px', padding: '14px 16px', cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ color: '#fafafa', fontSize: '14px', fontWeight: 600, margin: '0 0 2px' }}>
                    {c.name}
                    {c.is_gold && <span style={{ marginLeft: '6px', fontSize: '12px' }}>⭐</span>}
                    {isBirthdayToday(c.date_of_birth) && <span style={{ marginLeft: '6px', fontSize: '12px' }}>🎂</span>}
                  </p>
                  {c.email && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: 0 }}>{c.email}</p>}
                  {c.phone && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '2px 0 0' }}>{c.phone}</p>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: '#f5c842', fontSize: '14px', fontWeight: 700, margin: '0 0 2px' }}>
                    {c.khula_bucks}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', margin: 0 }}>bucks</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT — Detail Panel */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {!selected ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.25)', fontSize: '14px' }}>
            Select a customer to view details
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Header */}
            <div style={{ background: '#1e1500', border: '1px solid #2e2000', borderRadius: '12px', padding: '24px' }}>
              {mode === 'edit' ? (
                <>
                  <p style={{ fontSize: '10px', letterSpacing: '3px', color: '#f5c842', textTransform: 'uppercase', marginBottom: '16px' }}>
                    Edit Customer
                  </p>
                  <CustomerForm
                    initial={{ ...selected, date_of_birth: selected.date_of_birth ? selected.date_of_birth.slice(0, 10) : '' }}
                    onSave={async () => {
                      const all = await getCustomers()
                      setCustomers(all)
                      const refreshed = all.find(c => c.id === selected.id)
                      if (refreshed) setSelected(refreshed)
                      setMode('detail')
                    }}
                    onCancel={() => setMode('detail')}
                  />
                </>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-playfair)', color: '#fafafa', fontSize: '22px', margin: '0 0 4px' }}>
                      {selected.name}
                      {selected.is_gold && <span style={{ marginLeft: '8px', fontSize: '16px' }}>⭐ Gold</span>}
                    </h2>
                    {selected.email && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: '0 0 2px' }}>{selected.email}</p>}
                    {selected.phone && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: 0 }}>{selected.phone}</p>}
                    {selected.date_of_birth && (
                      <p style={{ fontSize: '13px', margin: '6px 0 0', color: isBirthdayToday(selected.date_of_birth) ? '#f5c842' : isBirthdaySoon(selected.date_of_birth) ? '#f5c842' : 'rgba(255,255,255,0.5)' }}>
                        🎂 {new Date(selected.date_of_birth).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long' })}
                        {isBirthdayToday(selected.date_of_birth) && <span style={{ marginLeft: '8px', fontWeight: 700 }}>— Birthday today! 🎉</span>}
                        {!isBirthdayToday(selected.date_of_birth) && isBirthdaySoon(selected.date_of_birth) && <span style={{ marginLeft: '8px' }}>— Coming up soon</span>}
                      </p>
                    )}
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: '8px 0 0' }}>
                      Member since {new Date(selected.created_at).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: '#f5c842', fontSize: '32px', fontWeight: 700, fontFamily: 'var(--font-playfair)', margin: 0, lineHeight: 1 }}>
                        {selected.khula_bucks}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '4px 0 0' }}>Khula Bucks</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        style={{ ...btnGhost, fontSize: '11px', padding: '6px 12px', color: selected.is_gold ? '#f5c842' : 'rgba(255,255,255,0.4)', borderColor: selected.is_gold ? '#f5c842' : '#2e2000' }}
                        onClick={() => handleGoldToggle(selected)}
                      >
                        {selected.is_gold ? '⭐ Gold' : 'Set Gold'}
                      </button>
                      <button style={{ ...btnGhost, fontSize: '11px', padding: '6px 12px' }} onClick={() => setMode('edit')}>Edit</button>
                      <button style={btnDanger} onClick={() => handleDelete(selected.id)}>Delete</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tabs */}
            {mode !== 'edit' && (
              <>
                <div style={{ display: 'flex', gap: '4px', background: '#1e1500', borderRadius: '10px', padding: '4px', border: '1px solid #2e2000' }}>
                  {[
                    { key: 'purchase', label: 'Record Purchase' },
                    { key: 'redeem', label: 'Redeem Bucks' },
                    { key: 'history', label: 'History' },
                  ].map(t => (
                    <button
                      key={t.key}
                      onClick={() => setActiveTab(t.key)}
                      style={{
                        flex: 1, padding: '8px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                        background: activeTab === t.key ? '#2e2000' : 'transparent',
                        color: activeTab === t.key ? '#f5c842' : 'rgba(255,255,255,0.45)',
                        fontSize: '12px', fontWeight: activeTab === t.key ? 600 : 400, transition: 'all 0.15s',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div style={{ background: '#1e1500', border: '1px solid #2e2000', borderRadius: '12px', padding: '24px' }}>
                  {activeTab === 'purchase' && (
                    <PurchaseForm customer={selected} onDone={handleActionDone} />
                  )}

                  {activeTab === 'redeem' && (
                    <RedeemForm customer={selected} onDone={handleActionDone} />
                  )}

                  {activeTab === 'history' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {transactions.length === 0 && (
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>
                          No transactions yet
                        </p>
                      )}
                      {transactions.map(tx => (
                        <div key={tx.id} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                          padding: '12px 16px', background: '#140e00', borderRadius: '8px',
                          border: '1px solid #2e2000',
                        }}>
                          <div>
                            <p style={{ color: '#fafafa', fontSize: '13px', fontWeight: 600, margin: '0 0 4px', textTransform: 'capitalize' }}>
                              {tx.type}
                              {tx.discount_pct ? <span style={{ marginLeft: '8px', color: '#f5c842', fontSize: '11px' }}>{tx.discount_pct}% discount</span> : null}
                            </p>
                            {tx.notes && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>{tx.notes}</p>}
                            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', margin: '4px 0 0' }}>
                              {new Date(tx.created_at).toLocaleString('en-ZA')}
                            </p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            {tx.amount_cents != null && (
                              <p style={{ color: '#fafafa', fontSize: '13px', fontWeight: 600, margin: '0 0 2px' }}>
                                R{(tx.amount_cents / 100).toFixed(2)}
                              </p>
                            )}
                            {tx.bucks_earned > 0 && (
                              <p style={{ color: '#f5c842', fontSize: '12px', margin: 0 }}>+{tx.bucks_earned} bucks</p>
                            )}
                            {tx.bucks_redeemed > 0 && (
                              <p style={{ color: '#ff6b6b', fontSize: '12px', margin: 0 }}>−{tx.bucks_redeemed} bucks</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
