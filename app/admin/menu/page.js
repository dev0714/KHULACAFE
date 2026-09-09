'use client'
import { useState, useEffect, useTransition, useCallback } from 'react'
import { supabase } from '../../../lib/supabase-public'
import { upsertCategory, deleteCategory, upsertSubcategory, deleteSubcategory, upsertMenuItem, deleteMenuItem } from '../actions'
import ImageUpload from '../../../components/admin/ImageUpload'
import { PageHeader, Card, Btn, Pill, Icon, Empty } from '../../../components/admin/ui'

const blankCat = { name: '', icon: '🍽️', description: '' }
const blankSub = { name: '', description: '' }
const blankItemFor = (subId) => ({ name: '', description: '', price: 'Ask us', price_cents: '', badge: '', image_url: '', is_featured: false, subcategory_id: subId || '' })

function Field({ label, children, span }) {
  return <div style={span ? { gridColumn: '1/-1' } : undefined}><label className="adm-label">{label}</label>{children}</div>
}
const IconBtn = ({ onClick, title, danger, children }) => (
  <button type="button" onClick={onClick} title={title} className="adm-iconbtn" style={{ width: '30px', height: '30px', borderRadius: '8px', color: danger ? 'var(--adm-red)' : undefined }}>{children}</button>
)

export default function MenuAdmin() {
  const [categories, setCategories] = useState([])
  const [selectedCat, setSelectedCat] = useState(null)
  const [subcategories, setSubcategories] = useState([])
  const [selectedSub, setSelectedSub] = useState(null)
  const [items, setItems] = useState([])

  const [catForm, setCatForm] = useState(blankCat)
  const [editingCat, setEditingCat] = useState(null)
  const [subForm, setSubForm] = useState(blankSub)
  const [editingSub, setEditingSub] = useState(null)
  const [showSubForm, setShowSubForm] = useState(false)
  const [itemForm, setItemForm] = useState(blankItemFor(''))
  const [editingItem, setEditingItem] = useState(null)
  const [isPending, startTransition] = useTransition()

  const loadCategories = useCallback(async () => {
    const { data } = await supabase.from('menu_categories').select('*').order('sort_order')
    setCategories(data || [])
  }, [])
  const loadSubcategories = useCallback(async (catId) => {
    const { data } = await supabase.from('menu_subcategories').select('*').eq('category_id', catId).order('sort_order')
    setSubcategories(data || [])
    setSelectedSub(null)
  }, [])
  const loadItems = useCallback(async (catId, subId) => {
    let q = supabase.from('menu_items').select('*').eq('category_id', catId).order('sort_order')
    q = subId ? q.eq('subcategory_id', subId) : q.is('subcategory_id', null)
    const { data } = await q
    setItems(data || [])
  }, [])

  useEffect(() => { loadCategories() }, [loadCategories])
  useEffect(() => {
    if (selectedCat) { loadSubcategories(selectedCat.id); loadItems(selectedCat.id, null) }
    else { setSubcategories([]); setSelectedSub(null); setItems([]) }
  }, [selectedCat, loadSubcategories, loadItems])
  useEffect(() => { if (selectedCat) loadItems(selectedCat.id, selectedSub?.id ?? null) }, [selectedSub, selectedCat, loadItems])

  // ── Categories ──
  function saveCategory() {
    startTransition(async () => {
      const payload = { ...catForm, sort_order: editingCat ? editingCat.sort_order : categories.length }
      if (editingCat) payload.id = editingCat.id
      await upsertCategory(payload)
      setCatForm(blankCat); setEditingCat(null)
      await loadCategories()
    })
  }
  function removeCat(id) {
    if (!confirm('Delete this category and all its subcategories and items?')) return
    startTransition(async () => {
      await deleteCategory(id)
      if (selectedCat?.id === id) setSelectedCat(null)
      await loadCategories()
    })
  }

  // ── Sub-menus ──
  function saveSub() {
    startTransition(async () => {
      const payload = { ...subForm, category_id: selectedCat.id, sort_order: editingSub ? editingSub.sort_order : subcategories.length }
      if (editingSub) payload.id = editingSub.id
      await upsertSubcategory(payload)
      setSubForm(blankSub); setEditingSub(null); setShowSubForm(false)
      await loadSubcategories(selectedCat.id)
    })
  }
  function removeSub(id) {
    if (!confirm('Delete this sub-menu? Items will be unassigned.')) return
    startTransition(async () => {
      await deleteSubcategory(id)
      if (selectedSub?.id === id) setSelectedSub(null)
      await loadSubcategories(selectedCat.id)
    })
  }

  // ── Items ──
  function saveItem() {
    startTransition(async () => {
      const payload = {
        ...itemForm,
        price_cents: itemForm.price_cents !== '' ? Math.round(Number(itemForm.price_cents) * 100) : null,
        category_id: selectedCat.id,
        subcategory_id: itemForm.subcategory_id || null,
        sort_order: editingItem ? editingItem.sort_order : items.length,
      }
      if (editingItem) payload.id = editingItem.id
      await upsertMenuItem(payload)
      setItemForm(blankItemFor(selectedSub?.id)); setEditingItem(null)
      await loadItems(selectedCat.id, selectedSub?.id ?? null)
    })
  }
  function removeItem(id) {
    if (!confirm('Delete this item?')) return
    startTransition(async () => { await deleteMenuItem(id); await loadItems(selectedCat.id, selectedSub?.id ?? null) })
  }
  function editItemStart(item) {
    setEditingItem(item)
    setItemForm({ name: item.name, description: item.description || '', price: item.price, price_cents: item.price_cents ? (item.price_cents / 100).toString() : '', badge: item.badge || '', image_url: item.image_url || '', is_featured: item.is_featured, subcategory_id: item.subcategory_id || '' })
    document.getElementById('item-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <PageHeader
        title="Menu"
        subtitle="Categories, sub-menus and every dish on the menu."
        actions={selectedCat && <Btn variant="primary" onClick={() => { setEditingItem(null); setItemForm(blankItemFor(selectedSub?.id)); document.getElementById('item-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}>{Icon.plus(16)} Add item</Btn>}
      />

      <div className="admin-menu-grid" style={{ display: 'grid', gridTemplateColumns: '260px minmax(0, 1fr)', gap: '16px', alignItems: 'start' }}>
        {/* ── Categories column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '84px' }}>
          <Card style={{ padding: '10px' }}>
            <div className="adm-th" style={{ padding: '6px 12px 10px' }}>Categories</div>
            {categories.length === 0 && <p style={{ fontSize: '12px', color: 'var(--adm-faint)', padding: '6px 12px' }}>No categories yet.</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {categories.map(cat => {
                const sel = selectedCat?.id === cat.id
                return (
                  <div key={cat.id} onClick={() => { setSelectedCat(cat); setEditingCat(null); setEditingItem(null); setItemForm(blankItemFor('')) }}
                    className={`adm-nav-item${sel ? ' active' : ''}`} style={{ cursor: 'pointer', justifyContent: 'space-between', padding: '8px 8px 8px 12px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <span>{cat.icon}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.name}</span>
                    </span>
                    <span style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                      <IconBtn title="Edit" onClick={e => { e.stopPropagation(); setEditingCat(cat); setCatForm({ name: cat.name, icon: cat.icon, description: cat.description || '' }) }}>{Icon.edit(13)}</IconBtn>
                      <IconBtn title="Delete" danger onClick={e => { e.stopPropagation(); removeCat(cat.id) }}>{Icon.trash(13)}</IconBtn>
                    </span>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card style={{ padding: '18px' }}>
            <p className="adm-th" style={{ marginBottom: '14px' }}>{editingCat ? 'Edit category' : 'New category'}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input className="adm-input" placeholder="Name" value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} />
              <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: '8px' }}>
                <input className="adm-input" placeholder="Icon" value={catForm.icon} onChange={e => setCatForm(f => ({ ...f, icon: e.target.value }))} style={{ textAlign: 'center' }} />
                <input className="adm-input" placeholder="Description" value={catForm.description} onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Btn variant="primary" className="adm-btn-sm" onClick={saveCategory} disabled={isPending || !catForm.name}>{isPending ? '…' : editingCat ? 'Update' : 'Add category'}</Btn>
                {editingCat && <Btn className="adm-btn-sm" onClick={() => { setEditingCat(null); setCatForm(blankCat) }}>Cancel</Btn>}
              </div>
            </div>
          </Card>
        </div>

        {/* ── Items column ── */}
        {!selectedCat ? (
          <Card><Empty>Select a category on the left to manage its dishes.</Empty></Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '20px', fontWeight: 700 }}>{selectedCat.icon} {selectedCat.name}</span>
              <span style={{ fontSize: '12px', color: 'var(--adm-faint)' }}>{items.length} item{items.length !== 1 ? 's' : ''}{selectedSub ? ` in ${selectedSub.name}` : ' uncategorised'} · {subcategories.length} sub-menu{subcategories.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Sub-menu pills */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button type="button" onClick={() => { setSelectedSub(null); setEditingSub(null) }} className={`adm-tab${!selectedSub ? ' active' : ''}`} style={{ border: '1px solid var(--adm-border)', borderRadius: '20px', background: !selectedSub ? undefined : 'var(--adm-surface)' }}>Uncategorised</button>
              {subcategories.map(sub => {
                const on = selectedSub?.id === sub.id
                return (
                  <span key={sub.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', borderRadius: '20px', border: '1px solid var(--adm-border)', background: on ? undefined : 'var(--adm-surface)', paddingRight: on ? '4px' : 0, overflow: 'hidden' }}>
                    <button type="button" onClick={() => { setSelectedSub(sub); setEditingSub(null) }} className={`adm-tab${on ? ' active' : ''}`} style={{ borderRadius: '20px' }}>{sub.name}</button>
                    {on && (
                      <>
                        <button type="button" title="Edit sub-menu" onClick={() => { setEditingSub(sub); setSubForm({ name: sub.name, description: sub.description || '' }); setShowSubForm(true) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--adm-muted)', display: 'flex', padding: '4px' }}>{Icon.edit(13)}</button>
                        <button type="button" title="Delete sub-menu" onClick={() => removeSub(sub.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--adm-red)', display: 'flex', padding: '4px' }}>{Icon.trash(13)}</button>
                      </>
                    )}
                  </span>
                )
              })}
              <Btn className="adm-btn-sm" onClick={() => { setEditingSub(null); setSubForm(blankSub); setShowSubForm(s => !s) }}>{Icon.plus(14)} Sub-menu</Btn>
            </div>

            {showSubForm && (
              <Card style={{ padding: '16px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span className="adm-th" style={{ marginRight: '4px' }}>{editingSub ? 'Edit sub-menu' : 'New sub-menu'}</span>
                <input className="adm-input" style={{ flex: 1, minWidth: '160px' }} placeholder="Name (e.g. Starters)" value={subForm.name} onChange={e => setSubForm(f => ({ ...f, name: e.target.value }))} />
                <input className="adm-input" style={{ flex: 1.4, minWidth: '160px' }} placeholder="Description (optional)" value={subForm.description} onChange={e => setSubForm(f => ({ ...f, description: e.target.value }))} />
                <Btn variant="primary" onClick={saveSub} disabled={isPending || !subForm.name}>{isPending ? '…' : editingSub ? 'Update' : 'Add'}</Btn>
                <Btn onClick={() => { setShowSubForm(false); setEditingSub(null); setSubForm(blankSub) }}>Cancel</Btn>
              </Card>
            )}

            {/* Dish grid */}
            {items.length === 0 ? (
              <Card><Empty>No items here yet — add one below.</Empty></Card>
            ) : (
              <div className="adm-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
                {items.map(item => (
                  <Card key={item.id} className="hover" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ height: '128px', background: 'linear-gradient(135deg, var(--adm-surface2), var(--adm-page))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--adm-faint)', position: 'relative' }}>
                      {item.image_url ? <img src={item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : Icon.image(26)}
                      {item.badge && <span style={{ position: 'absolute', top: '10px', left: '10px', background: 'var(--adm-gold)', color: 'var(--adm-page)', fontSize: '9px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', padding: '4px 8px', borderRadius: '20px' }}>{item.badge}</span>}
                      {item.is_featured && <span style={{ position: 'absolute', top: '10px', right: '10px' }}><Pill color="var(--adm-gold)">Favourite</Pill></span>}
                    </div>
                    <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, lineHeight: 1.3 }}>{item.name}</span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--adm-gold)', whiteSpace: 'nowrap' }}>{item.price_cents ? `R${(item.price_cents / 100).toFixed(0)}` : item.price}</span>
                      </div>
                      {item.description && <span style={{ fontSize: '11px', color: 'var(--adm-faint)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.description}</span>}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px', marginTop: 'auto' }}>
                        <IconBtn title="Edit" onClick={() => editItemStart(item)}>{Icon.edit(13)}</IconBtn>
                        <IconBtn title="Delete" danger onClick={() => removeItem(item.id)}>{Icon.trash(13)}</IconBtn>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Item editor */}
            <Card id="item-editor" style={{ padding: '22px' }}>
              <p className="adm-th" style={{ marginBottom: '16px' }}>{editingItem ? `Edit item — ${editingItem.name}` : 'New item'}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <Field label="Name"><input className="adm-input" value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))} /></Field>
                <Field label="Display price (e.g. R85)"><input className="adm-input" value={itemForm.price} onChange={e => setItemForm(f => ({ ...f, price: e.target.value }))} /></Field>
                <Field label="Cart price (R) — blank = 'Ask us'"><input className="adm-input" type="number" min="0" step="0.01" value={itemForm.price_cents} onChange={e => setItemForm(f => ({ ...f, price_cents: e.target.value }))} /></Field>
                <Field label="Sub-menu">
                  <select className="adm-input" value={itemForm.subcategory_id} onChange={e => setItemForm(f => ({ ...f, subcategory_id: e.target.value }))}>
                    <option value="">— None (uncategorised) —</option>
                    {subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </Field>
                <Field label="Description" span><input className="adm-input" value={itemForm.description} onChange={e => setItemForm(f => ({ ...f, description: e.target.value }))} /></Field>
                <Field label="Badge (optional)"><input className="adm-input" value={itemForm.badge} onChange={e => setItemForm(f => ({ ...f, badge: e.target.value }))} placeholder="e.g. Fan Fav" /></Field>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '22px', fontSize: '13px', color: 'var(--adm-muted)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={itemForm.is_featured} onChange={e => setItemForm(f => ({ ...f, is_featured: e.target.checked }))} /> Mark as Khula favourite
                </label>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label className="adm-label">Photo</label>
                <ImageUpload value={itemForm.image_url} onChange={url => setItemForm(f => ({ ...f, image_url: url }))} folder="menu" aspect={4 / 3} />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Btn variant="primary" onClick={saveItem} disabled={isPending || !itemForm.name}>{isPending ? 'Saving…' : editingItem ? 'Update item' : 'Add item'}</Btn>
                {editingItem && <Btn onClick={() => { setEditingItem(null); setItemForm(blankItemFor(selectedSub?.id)) }}>Cancel</Btn>}
              </div>
            </Card>
          </div>
        )}
      </div>
    </>
  )
}
