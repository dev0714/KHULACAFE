'use client'
import { useState, useEffect, useTransition, useCallback } from 'react'
import { supabase } from '../../../lib/supabase-public'
import { upsertCategory, deleteCategory, upsertSubcategory, deleteSubcategory, upsertMenuItem, deleteMenuItem } from '../actions'
import ImageUpload from '../../../components/admin/ImageUpload'

const inputStyle = { width: '100%', padding: '10px 14px', background: '#0a0600', border: '1px solid #2e2000', borderRadius: '8px', color: '#fafafa', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }
const labelStyle = { display: 'block', fontSize: '10px', letterSpacing: '2px', color: '#f5c842', marginBottom: '6px', textTransform: 'uppercase' }
const btn = (primary) => ({ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', background: primary ? 'linear-gradient(135deg, #f5c842, #c8940c)' : '#2e2000', color: primary ? '#0a0600' : 'rgba(255,255,255,0.7)', fontWeight: primary ? 700 : 400 })
const panel = { background: '#1e1500', border: '1px solid #2e2000', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '0' }

export default function MenuAdmin() {
  const [categories, setCategories] = useState([])
  const [selectedCat, setSelectedCat] = useState(null)
  const [subcategories, setSubcategories] = useState([])
  const [selectedSub, setSelectedSub] = useState(null)
  const [items, setItems] = useState([])

  const [catForm, setCatForm] = useState({ name: '', icon: '🍽️', description: '' })
  const [editingCat, setEditingCat] = useState(null)

  const [subForm, setSubForm] = useState({ name: '', description: '' })
  const [editingSub, setEditingSub] = useState(null)

  const [itemForm, setItemForm] = useState({ name: '', description: '', price: 'Ask us', price_cents: '', badge: '', image_url: '', is_featured: false, subcategory_id: '' })
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
    if (subId) q = q.eq('subcategory_id', subId)
    else q = q.is('subcategory_id', null)
    const { data } = await q
    setItems(data || [])
  }, [])

  useEffect(() => { loadCategories() }, [loadCategories])

  useEffect(() => {
    if (selectedCat) {
      loadSubcategories(selectedCat.id)
      loadItems(selectedCat.id, null)
    } else {
      setSubcategories([])
      setSelectedSub(null)
      setItems([])
    }
  }, [selectedCat, loadSubcategories, loadItems])

  useEffect(() => {
    if (selectedCat) loadItems(selectedCat.id, selectedSub?.id ?? null)
  }, [selectedSub, selectedCat, loadItems])

  // ── Category actions ──
  function saveCategory() {
    startTransition(async () => {
      const payload = { ...catForm, sort_order: editingCat ? editingCat.sort_order : categories.length }
      if (editingCat) payload.id = editingCat.id
      await upsertCategory(payload)
      setCatForm({ name: '', icon: '🍽️', description: '' })
      setEditingCat(null)
      await loadCategories()
    })
  }
  function removeCat(id) {
    if (!confirm('Delete this category and all its subcategories and items?')) return
    startTransition(async () => {
      await deleteCategory(id)
      if (selectedCat?.id === id) { setSelectedCat(null) }
      await loadCategories()
    })
  }

  // ── Subcategory actions ──
  function saveSub() {
    startTransition(async () => {
      const payload = { ...subForm, category_id: selectedCat.id, sort_order: editingSub ? editingSub.sort_order : subcategories.length }
      if (editingSub) payload.id = editingSub.id
      await upsertSubcategory(payload)
      setSubForm({ name: '', description: '' })
      setEditingSub(null)
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

  // ── Item actions ──
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
      setItemForm({ name: '', description: '', price: 'Ask us', price_cents: '', badge: '', image_url: '', is_featured: false, subcategory_id: selectedSub?.id || '' })
      setEditingItem(null)
      await loadItems(selectedCat.id, selectedSub?.id ?? null)
    })
  }
  function removeItem(id) {
    if (!confirm('Delete this item?')) return
    startTransition(async () => { await deleteMenuItem(id); await loadItems(selectedCat.id, selectedSub?.id ?? null) })
  }

  const blankItem = { name: '', description: '', price: 'Ask us', price_cents: '', badge: '', image_url: '', is_featured: false, subcategory_id: selectedSub?.id || '' }

  return (
    <>
      <h1 style={{ fontFamily: 'var(--font-playfair)', color: '#fafafa', fontSize: '28px', marginBottom: '24px' }}>Menu Management</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 240px 1fr', gap: '16px', alignItems: 'start' }}>

        {/* ── PANEL 1: Categories ── */}
        <div style={panel}>
          <p style={{ color: '#f5c842', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px', fontWeight: 700 }}>Categories</p>

          <div style={{ marginBottom: '12px' }}>
            {categories.map(cat => (
              <div key={cat.id} onClick={() => { setSelectedCat(cat); setEditingCat(null) }}
                style={{ padding: '9px 10px', borderRadius: '7px', cursor: 'pointer', marginBottom: '3px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: selectedCat?.id === cat.id ? '#2e2000' : 'transparent', border: `1px solid ${selectedCat?.id === cat.id ? '#f5c842' : 'transparent'}` }}>
                <span style={{ color: '#fafafa', fontSize: '12px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.icon} {cat.name}</span>
                <div style={{ flexShrink: 0 }}>
                  <button onClick={e => { e.stopPropagation(); setEditingCat(cat); setCatForm({ name: cat.name, icon: cat.icon, description: cat.description || '' }) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}>✏️</button>
                  <button onClick={e => { e.stopPropagation(); removeCat(cat.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid #2e2000', paddingTop: '12px' }}>
            <p style={{ color: '#f5c842', fontSize: '9px', letterSpacing: '2px', marginBottom: '8px', textTransform: 'uppercase' }}>{editingCat ? 'Edit' : 'Add'} Category</p>
            <input placeholder="Name" value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} style={{ ...inputStyle, marginBottom: '6px' }} />
            <input placeholder="Icon emoji" value={catForm.icon} onChange={e => setCatForm(f => ({ ...f, icon: e.target.value }))} style={{ ...inputStyle, marginBottom: '6px' }} />
            <input placeholder="Description" value={catForm.description} onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, marginBottom: '10px' }} />
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={saveCategory} disabled={isPending || !catForm.name} style={btn(true)}>{isPending ? '…' : editingCat ? 'Update' : 'Add'}</button>
              {editingCat && <button onClick={() => { setEditingCat(null); setCatForm({ name: '', icon: '🍽️', description: '' }) }} style={btn(false)}>Cancel</button>}
            </div>
          </div>
        </div>

        {/* ── PANEL 2: Subcategories ── */}
        {!selectedCat ? (
          <div style={{ ...panel, alignItems: 'center', justifyContent: 'center', minHeight: '120px' }}>
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px', textAlign: 'center' }}>Select a category</p>
          </div>
        ) : (
          <div style={panel}>
            <p style={{ color: '#f5c842', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px', fontWeight: 700 }}>Sub-menus</p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', marginBottom: '10px' }}>{selectedCat.icon} {selectedCat.name}</p>

            {/* "All items" row */}
            <div onClick={() => setSelectedSub(null)}
              style={{ padding: '9px 10px', borderRadius: '7px', cursor: 'pointer', marginBottom: '3px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: !selectedSub ? '#2e2000' : 'transparent', border: `1px solid ${!selectedSub ? '#f5c842' : 'transparent'}` }}>
              <span style={{ color: '#fafafa', fontSize: '12px' }}>📋 Uncategorised items</span>
            </div>

            {subcategories.map(sub => (
              <div key={sub.id} onClick={() => { setSelectedSub(sub); setEditingSub(null) }}
                style={{ padding: '9px 10px', borderRadius: '7px', cursor: 'pointer', marginBottom: '3px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: selectedSub?.id === sub.id ? '#2e2000' : 'transparent', border: `1px solid ${selectedSub?.id === sub.id ? '#f5c842' : 'transparent'}` }}>
                <span style={{ color: '#fafafa', fontSize: '12px', flex: 1 }}>📂 {sub.name}</span>
                <div style={{ flexShrink: 0 }}>
                  <button onClick={e => { e.stopPropagation(); setEditingSub(sub); setSubForm({ name: sub.name, description: sub.description || '' }) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}>✏️</button>
                  <button onClick={e => { e.stopPropagation(); removeSub(sub.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}>🗑️</button>
                </div>
              </div>
            ))}

            <div style={{ borderTop: '1px solid #2e2000', paddingTop: '12px', marginTop: '8px' }}>
              <p style={{ color: '#f5c842', fontSize: '9px', letterSpacing: '2px', marginBottom: '8px', textTransform: 'uppercase' }}>{editingSub ? 'Edit' : 'Add'} Sub-menu</p>
              <input placeholder="Name (e.g. Starters)" value={subForm.name} onChange={e => setSubForm(f => ({ ...f, name: e.target.value }))} style={{ ...inputStyle, marginBottom: '6px' }} />
              <input placeholder="Description (optional)" value={subForm.description} onChange={e => setSubForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, marginBottom: '10px' }} />
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={saveSub} disabled={isPending || !subForm.name} style={btn(true)}>{isPending ? '…' : editingSub ? 'Update' : 'Add'}</button>
                {editingSub && <button onClick={() => { setEditingSub(null); setSubForm({ name: '', description: '' }) }} style={btn(false)}>Cancel</button>}
              </div>
            </div>
          </div>
        )}

        {/* ── PANEL 3: Items ── */}
        {!selectedCat ? (
          <div style={{ ...panel, alignItems: 'center', justifyContent: 'center', minHeight: '120px' }}>
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px', textAlign: 'center' }}>Select a category</p>
          </div>
        ) : (
          <div style={panel}>
            <h2 style={{ color: '#f5c842', fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>
              {selectedCat.icon} {selectedCat.name}{selectedSub ? ` › ${selectedSub.name}` : ' › Uncategorised'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', marginBottom: '14px' }}>
              {items.length} item{items.length !== 1 ? 's' : ''}
            </p>

            {items.map(item => (
              <div key={item.id} style={{ padding: '12px 14px', background: '#0a0600', borderRadius: '8px', border: '1px solid #2e2000', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', minWidth: 0 }}>
                  {item.image_url && <img src={item.image_url} style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} alt="" />}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: '#fafafa', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>
                      {item.price}
                      {item.price_cents ? <span style={{ color: '#26de81', marginLeft: '6px' }}>R{(item.price_cents / 100).toFixed(2)}</span> : null}
                      {item.badge ? ` · ${item.badge}` : ''}{item.is_featured ? ' · ⭐' : ''}
                    </div>
                  </div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <button onClick={() => {
                    setEditingItem(item)
                    setItemForm({ name: item.name, description: item.description || '', price: item.price, price_cents: item.price_cents ? (item.price_cents / 100).toString() : '', badge: item.badge || '', image_url: item.image_url || '', is_featured: item.is_featured, subcategory_id: item.subcategory_id || '' })
                  }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', marginRight: '4px' }}>✏️</button>
                  <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px' }}>🗑️</button>
                </div>
              </div>
            ))}

            <div style={{ borderTop: '1px solid #2e2000', paddingTop: '20px', marginTop: '12px' }}>
              <p style={{ color: '#f5c842', fontSize: '10px', letterSpacing: '2px', marginBottom: '14px', textTransform: 'uppercase' }}>{editingItem ? 'Edit' : 'Add'} Item</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div><label style={labelStyle}>Name</label><input value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} /></div>
                <div><label style={labelStyle}>Display Price (e.g. R85)</label><input value={itemForm.price} onChange={e => setItemForm(f => ({ ...f, price: e.target.value }))} style={inputStyle} /></div>
                <div><label style={labelStyle}>Cart Price in Rands</label><input type="number" min="0" step="0.01" value={itemForm.price_cents} onChange={e => setItemForm(f => ({ ...f, price_cents: e.target.value }))} placeholder="Leave blank = 'Ask us'" style={inputStyle} /></div>
                <div>
                  <label style={labelStyle}>Sub-menu</label>
                  <select value={itemForm.subcategory_id} onChange={e => setItemForm(f => ({ ...f, subcategory_id: e.target.value }))} style={inputStyle}>
                    <option value="">— None (uncategorised) —</option>
                    {subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: '1/-1' }}><label style={labelStyle}>Description</label><input value={itemForm.description} onChange={e => setItemForm(f => ({ ...f, description: e.target.value }))} style={inputStyle} /></div>
                <div><label style={labelStyle}>Badge (optional)</label><input value={itemForm.badge} onChange={e => setItemForm(f => ({ ...f, badge: e.target.value }))} placeholder="Fan Fav" style={inputStyle} /></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '18px' }}>
                  <input type="checkbox" id="feat" checked={itemForm.is_featured} onChange={e => setItemForm(f => ({ ...f, is_featured: e.target.checked }))} />
                  <label htmlFor="feat" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>Khula Favourite ⭐</label>
                </div>
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Image</label>
                <ImageUpload value={itemForm.image_url} onChange={url => setItemForm(f => ({ ...f, image_url: url }))} folder="menu" aspect={4/3} />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={saveItem} disabled={isPending || !itemForm.name} style={btn(true)}>{isPending ? '…' : editingItem ? 'Update Item' : 'Add Item'}</button>
                {editingItem && <button onClick={() => { setEditingItem(null); setItemForm(blankItem) }} style={btn(false)}>Cancel</button>}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
