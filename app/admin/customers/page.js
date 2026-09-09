'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  upsertCustomer, deleteCustomer, setGoldStatus, recordPurchase, redeemBucks,
  getCustomers, getTransactions, getMenuItemsForPOS,
} from '../actions'
import { PageHeader, Card, Pill, Btn, Tabs, Avatar, KpiTile, Icon, Empty } from '../../../components/admin/ui'

const GOLD = '#f5c842'

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

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="adm-label">{label}</label>
      {children}
      {hint && <p style={{ fontSize: '11px', color: 'var(--adm-faint)', margin: '6px 0 0' }}>{hint}</p>}
    </div>
  )
}

function CustomerForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', date_of_birth: '', ...initial })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    await upsertCustomer({ ...form, date_of_birth: form.date_of_birth || null })
    setSaving(false)
    onSave()
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <Field label="Name *"><input className="adm-input" value={form.name} onChange={e => set('name', e.target.value)} required /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Field label="Email"><input className="adm-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} /></Field>
        <Field label="Phone"><input className="adm-input" value={form.phone} onChange={e => set('phone', e.target.value)} /></Field>
      </div>
      <Field label="Date of birth" hint="Used to send birthday wishes.">
        <input className="adm-input" type="date" value={form.date_of_birth || ''} onChange={e => set('date_of_birth', e.target.value)} style={{ colorScheme: 'dark' }} />
      </Field>
      <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
        <Btn variant="primary" type="submit" disabled={saving}>{saving ? 'Saving…' : initial?.id ? 'Update customer' : 'Add customer'}</Btn>
        <Btn type="button" onClick={onCancel}>Cancel</Btn>
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

  useEffect(() => { getMenuItemsForPOS().then(setCategories).catch(() => {}) }, [])

  const allItems = categories.flatMap(cat => (cat.menu_items ?? []).map(item => ({ ...item, categoryName: cat.name })))

  function handleItemSelect(e) {
    const itemId = e.target.value
    setSelectedItem(itemId)
    if (!itemId) return
    const item = allItems.find(i => i.id === itemId)
    if (!item) return
    if (item.price_cents) setAmount((item.price_cents / 100).toFixed(2))
    else if (item.price && item.price !== 'Ask us') {
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
    setSelectedItem(''); setAmount(''); setDiscount(''); setNotes('')
    onDone()
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {result && (
        <div style={{ padding: '10px 14px', background: 'var(--adm-gold-soft)', borderRadius: '10px', border: '1px solid rgba(245,200,66,0.25)', fontSize: '13px', color: GOLD, display: 'flex', alignItems: 'center', gap: '8px' }}>
          {Icon.check(16)} +{result.bucksEarned} Khula Bucks earned
        </div>
      )}
      <Field label="Menu item (optional)">
        <select className="adm-input" style={{ cursor: 'pointer' }} value={selectedItem} onChange={handleItemSelect}>
          <option value="">— Select an item or enter a custom amount —</option>
          {categories.map(cat => (
            <optgroup key={cat.id} label={cat.name}>
              {(cat.menu_items ?? []).map(item => (
                <option key={item.id} value={item.id}>{item.name}{item.price && item.price !== 'Ask us' ? ` — ${item.price}` : ''}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Field label="Amount (R) *"><input className="adm-input" type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0.00" /></Field>
        <Field label="Discount %"><input className="adm-input" type="number" min="0" max="100" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0" /></Field>
      </div>
      <Field label="Notes"><input className="adm-input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Bunny Chow + drinks" /></Field>
      <div><Btn variant="primary" type="submit" disabled={saving || !amount}>{saving ? 'Recording…' : 'Record purchase'}</Btn></div>
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
    setError(''); setSaving(true)
    try {
      await redeemBucks(customer.id, parseInt(bucks), notes || null)
      setBucks(''); setNotes('')
      onDone()
    } catch (err) { setError(err.message) }
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {error && <p style={{ color: 'var(--adm-red)', fontSize: '12px', margin: 0 }}>{error}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Field label={`Bucks to redeem * (max ${customer.khula_bucks})`}><input className="adm-input" type="number" min="1" max={customer.khula_bucks} value={bucks} onChange={e => setBucks(e.target.value)} required /></Field>
        <Field label="Notes"><input className="adm-input" value={notes} onChange={e => setNotes(e.target.value)} /></Field>
      </div>
      <div><Btn variant="primary" type="submit" disabled={saving || !bucks}>{saving ? 'Redeeming…' : 'Redeem bucks'}</Btn></div>
    </form>
  )
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [transactions, setTransactions] = useState([])
  const [selected, setSelected] = useState(null)
  const [mode, setMode] = useState('list') // 'list' | 'add' | 'edit' | 'detail'
  const [activeTab, setActiveTab] = useState('purchase')
  const [listFilter, setListFilter] = useState('all') // 'all' | 'gold' | 'registered'
  const [search, setSearch] = useState('')

  const loadCustomers = useCallback(async () => { setCustomers(await getCustomers()) }, [])
  const loadTransactions = useCallback(async (id) => { setTransactions(await getTransactions(id)) }, [])

  useEffect(() => { loadCustomers() }, [loadCustomers])
  useEffect(() => { if (selected) loadTransactions(selected.id) }, [selected, loadTransactions])

  function handleSelect(c) { setSelected(c); setMode('detail'); setActiveTab('purchase') }

  async function handleDelete(id) {
    if (!confirm('Delete this customer? All transaction history will be lost.')) return
    await deleteCustomer(id)
    if (selected?.id === id) { setSelected(null); setMode('list') }
    loadCustomers()
  }

  async function handleGoldToggle(c) {
    await setGoldStatus(c.id, !c.is_gold)
    await loadCustomers()
    if (selected?.id === c.id) setSelected(prev => ({ ...prev, is_gold: !prev.is_gold }))
  }

  async function handleActionDone() {
    const [all] = await Promise.all([getCustomers(), selected ? loadTransactions(selected.id) : Promise.resolve()])
    setCustomers(all)
    if (selected) { const r = all.find(c => c.id === selected.id); if (r) setSelected(r) }
  }

  const q = search.toLowerCase()
  const filtered = customers.filter(c =>
    (listFilter === 'all' || (listFilter === 'gold' && c.is_gold) || (listFilter === 'registered' && c.email)) &&
    (c.name.toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q) || (c.phone || '').includes(search))
  )
  const goldCount = customers.filter(c => c.is_gold).length
  const totalBucks = customers.reduce((s, c) => s + (c.khula_bucks ?? 0), 0)

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle="Members, Khula Bucks balances and Gold status."
        actions={<Btn variant="primary" onClick={() => { setMode('add'); setSelected(null) }}>{Icon.plus(16)} Add customer</Btn>}
      />

      <div className="admin-stat-grid adm-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <KpiTile label="Total members" value={customers.length} hint="Loyalty customers" />
        <KpiTile label="Gold members" value={goldCount} hint="Khula Gold status" color={GOLD} />
        <KpiTile label="Bucks in circulation" value={totalBucks} hint="Across all customers" />
      </div>

      {mode === 'add' && (
        <Card style={{ padding: '24px', marginBottom: '20px', maxWidth: '640px' }}>
          <p className="adm-th" style={{ marginBottom: '16px' }}>New customer</p>
          <CustomerForm initial={{ name: '', email: '', phone: '' }} onSave={() => { loadCustomers(); setMode('list') }} onCancel={() => setMode('list')} />
        </Card>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <Tabs value={listFilter} onChange={setListFilter} items={[
          { key: 'all', label: 'All', count: customers.length },
          { key: 'gold', label: 'Gold', count: goldCount },
          { key: 'registered', label: 'Has email', count: customers.filter(c => c.email).length },
        ]} />
        <div className="adm-search" style={{ width: '260px' }}>
          <span className="adm-search-ico">{Icon.search(16)}</span>
          <input className="adm-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, phone…" />
        </div>
      </div>

      <div className="admin-chart-grid" style={{ display: 'grid', gridTemplateColumns: selected ? 'minmax(0, 1.2fr) minmax(0, 1fr)' : '1fr', gap: '16px', alignItems: 'start' }}>
        {/* List */}
        <Card style={{ overflow: 'hidden' }}>
          <div className="adm-table-head" style={{ gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr) 90px 100px' }}>
            <span className="adm-th">Customer</span><span className="adm-th">Contact</span><span className="adm-th">Bucks</span><span className="adm-th">Status</span>
          </div>
          {filtered.length === 0 && <Empty>{search ? 'No results.' : 'No customers yet.'}</Empty>}
          {filtered.map(c => {
            const sel = selected?.id === c.id
            const bdayToday = isBirthdayToday(c.date_of_birth)
            return (
              <div key={c.id} onClick={() => handleSelect(c)} className="adm-table-row adm-row"
                style={{ gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr) 90px 100px', cursor: 'pointer', background: sel ? 'var(--adm-gold-soft)' : 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <Avatar name={c.name} />
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span style={{ fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                    {bdayToday && <span style={{ fontSize: '11px', color: GOLD }}>Birthday today</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ fontSize: '12px', color: 'var(--adm-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.email || '—'}</span>
                  <span style={{ fontSize: '11px', color: 'var(--adm-faint)' }}>{c.phone || ''}</span>
                </div>
                <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '18px', fontWeight: 700, color: GOLD }}>{c.khula_bucks}</span>
                <Pill color={c.is_gold ? GOLD : 'rgba(255,255,255,0.45)'}>{c.is_gold ? 'Gold' : 'Member'}</Pill>
              </div>
            )
          })}
        </Card>

        {/* Detail */}
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '84px' }}>
            <Card style={{ padding: '24px' }}>
              {mode === 'edit' ? (
                <>
                  <p className="adm-th" style={{ marginBottom: '16px' }}>Edit customer</p>
                  <CustomerForm
                    initial={{ ...selected, date_of_birth: selected.date_of_birth ? selected.date_of_birth.slice(0, 10) : '' }}
                    onSave={async () => { const all = await getCustomers(); setCustomers(all); const r = all.find(c => c.id === selected.id); if (r) setSelected(r); setMode('detail') }}
                    onCancel={() => setMode('detail')}
                  />
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', minWidth: 0 }}>
                      <Avatar name={selected.name} size={48} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                        <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '22px', fontWeight: 700 }}>{selected.name}</span>
                        {selected.email && <span style={{ fontSize: '12px', color: 'var(--adm-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>{Icon.at(14)} {selected.email}</span>}
                        {selected.phone && <span style={{ fontSize: '12px', color: 'var(--adm-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>{Icon.phone(14)} {selected.phone}</span>}
                        <span style={{ fontSize: '11px', color: 'var(--adm-faint)' }}>Member since {new Date(selected.created_at).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        {selected.date_of_birth && (
                          <span style={{ fontSize: '12px', color: isBirthdayToday(selected.date_of_birth) || isBirthdaySoon(selected.date_of_birth) ? GOLD : 'var(--adm-muted)' }}>
                            Birthday {new Date(selected.date_of_birth).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long' })}
                            {isBirthdayToday(selected.date_of_birth) ? ' — today!' : isBirthdaySoon(selected.date_of_birth) ? ' — coming up' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div className="adm-th">Khula Bucks</div>
                      <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '34px', fontWeight: 700, color: GOLD, lineHeight: 1.1 }}>{selected.khula_bucks}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Btn className="adm-btn-sm" onClick={() => handleGoldToggle(selected)} style={selected.is_gold ? { color: GOLD, borderColor: GOLD } : undefined}>{selected.is_gold ? 'Gold member' : 'Set Gold'}</Btn>
                    <Btn onClick={() => setMode('edit')}>{Icon.edit(16)} Edit</Btn>
                    <div style={{ flex: 1 }} />
                    <Btn variant="danger" onClick={() => handleDelete(selected.id)}>{Icon.trash(16)} Delete</Btn>
                  </div>
                </div>
              )}
            </Card>

            {mode !== 'edit' && (
              <Card style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <Tabs value={activeTab} onChange={setActiveTab} items={[
                  { key: 'purchase', label: 'Record purchase' },
                  { key: 'redeem', label: 'Redeem bucks' },
                  { key: 'history', label: 'History', count: transactions.length },
                ]} />
                {activeTab === 'purchase' && <PurchaseForm customer={selected} onDone={handleActionDone} />}
                {activeTab === 'redeem' && <RedeemForm customer={selected} onDone={handleActionDone} />}
                {activeTab === 'history' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {transactions.length === 0 && <Empty>No transactions yet.</Empty>}
                    {transactions.map(tx => (
                      <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', padding: '12px 14px', background: 'var(--adm-page)', borderRadius: '10px', border: '1px solid var(--adm-border)' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Pill color={tx.type === 'redeem' ? 'var(--adm-red)' : GOLD}>{tx.type}</Pill>
                            {tx.discount_pct ? <span style={{ fontSize: '11px', color: 'var(--adm-faint)' }}>{tx.discount_pct}% discount</span> : null}
                          </div>
                          {tx.notes && <p style={{ color: 'var(--adm-muted)', fontSize: '12px', margin: '6px 0 0' }}>{tx.notes}</p>}
                          <p style={{ color: 'var(--adm-faint)', fontSize: '11px', margin: '4px 0 0' }}>{new Date(tx.created_at).toLocaleString('en-ZA')}</p>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          {tx.amount_cents != null && <p style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 2px' }}>R{(tx.amount_cents / 100).toFixed(2)}</p>}
                          {tx.bucks_earned > 0 && <p style={{ color: GOLD, fontSize: '12px', margin: 0 }}>+{tx.bucks_earned} bucks</p>}
                          {tx.bucks_redeemed > 0 && <p style={{ color: 'var(--adm-red)', fontSize: '12px', margin: 0 }}>−{tx.bucks_redeemed} bucks</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>
        )}
      </div>
    </>
  )
}
