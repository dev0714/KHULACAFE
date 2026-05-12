'use client'
import { useState, useEffect, useTransition, useCallback } from 'react'
import { supabase } from '../../../lib/supabase-public'
import { upsertCategory, deleteCategory, upsertMenuItem, deleteMenuItem } from '../actions'
import ImageUpload from '../../../components/admin/ImageUpload'

const inputStyle = { width: '100%', padding: '10px 14px', background: '#0a0600', border: '1px solid #2e2000', borderRadius: '8px', color: '#fafafa', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }
const labelStyle = { display: 'block', fontSize: '10px', letterSpacing: '2px', color: '#f5c842', marginBottom: '6px', textTransform: 'uppercase' }
const btn = (primary) => ({ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', background: primary ? 'linear-gradient(135deg, #f5c842, #c8940c)' : '#2e2000', color: primary ? '#0a0600' : 'rgba(255,255,255,0.7)', fontWeight: primary ? 700 : 400 })

export default function MenuAdmin() {
  const [categories, setCategories] = useState([])
  const [selectedCat, setSelectedCat] = useState(null)
  const [items, setItems] = useState([])
  const [catForm, setCatForm] = useState({ name: '', icon: '🍽️', description: '' })
  const [itemForm, setItemForm] = useState({ name: '', description: '', price: 'Ask us', price_cents: '', badge: '', image_url: '', is_featured: false })
  const [editingCat, setEditingCat] = useState(null)
  const [editingItem, setEditingItem] = useState(null)
  const [isPending, startTransition] = useTransition()

  const loadCategories = useCallback(async () => {
    const { data } = await supabase.from('menu_categories').select('*').order('sort_order')
    setCategories(data || [])
  }, [])

  const loadItems = useCallback(async (catId) => {
    const { data } = await supabase.from('menu_items').select('*').eq('category_id', catId).order('sort_order')
    setItems(data || [])
  }, [])

  useEffect(() => { loadCategories() }, [loadCategories])
  useEffect(() => { if (selectedCat) loadItems(selectedCat.id) }, [selectedCat, loadItems])

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
    if (!confirm('Delete this category and all its items?')) return
    startTransition(async () => { await deleteCategory(id); if (selectedCat?.id === id) setSelectedCat(null); await loadCategories() })
  }

  function saveItem() {
    startTransition(async () => {
      const payload = {
        ...itemForm,
        price_cents: itemForm.price_cents !== '' ? Math.round(Number(itemForm.price_cents) * 100) : null,
        category_id: selectedCat.id,
        sort_order: editingItem ? editingItem.sort_order : items.length,
      }
      if (editingItem) payload.id = editingItem.id
      await upsertMenuItem(payload)
      setItemForm({ name: '', description: '', price: 'Ask us', price_cents: '', badge: '', image_url: '', is_featured: false })
      setEditingItem(null)
      await loadItems(selectedCat.id)
    })
  }

  function removeItem(id) {
    if (!confirm('Delete this item?')) return
    startTransition(async () => { await deleteMenuItem(id); await loadItems(selectedCat.id) })
  }

  return (
    <>
      <h1 style={{ fontFamily: 'var(--font-playfair)', color: '#fafafa', fontSize: '28px', marginBottom: '32px' }}>Menu Management</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '32px', alignItems: 'start' }}>
        {/* Categories panel */}
        <div style={{ background: '#1e1500', border: '1px solid #2e2000', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ color: '#f5c842', fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' }}>Categories</h2>

          {categories.map(cat => (
            <div key={cat.id} onClick={() => setSelectedCat(cat)} style={{ padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', background: selectedCat?.id === cat.id ? '#2e2000' : 'transparent', border: `1px solid ${selectedCat?.id === cat.id ? '#f5c842' : 'transparent'}`, marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#fafafa', fontSize: '13px' }}>{cat.icon} {cat.name}</span>
              <div>
                <button onClick={e => { e.stopPropagation(); setEditingCat(cat); setCatForm({ name: cat.name, icon: cat.icon, description: cat.description || '' }) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', marginRight: '4px' }}>✏️</button>
                <button onClick={e => { e.stopPropagation(); removeCat(cat.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px' }}>🗑️</button>
              </div>
            </div>
          ))}

          <div style={{ borderTop: '1px solid #2e2000', paddingTop: '16px', marginTop: '16px' }}>
            <p style={{ color: '#f5c842', fontSize: '10px', letterSpacing: '2px', marginBottom: '10px' }}>{editingCat ? 'EDIT' : 'ADD'} CATEGORY</p>
            <input placeholder="Name" value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} style={{ ...inputStyle, marginBottom: '8px' }} />
            <input placeholder="Icon emoji" value={catForm.icon} onChange={e => setCatForm(f => ({ ...f, icon: e.target.value }))} style={{ ...inputStyle, marginBottom: '8px' }} />
            <input placeholder="Description" value={catForm.description} onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, marginBottom: '12px' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={saveCategory} disabled={isPending || !catForm.name} style={btn(true)}>{isPending ? '…' : editingCat ? 'Update' : 'Add'}</button>
              {editingCat && <button onClick={() => { setEditingCat(null); setCatForm({ name: '', icon: '🍽️', description: '' }) }} style={btn(false)}>Cancel</button>}
            </div>
          </div>
        </div>

        {/* Items panel */}
        {!selectedCat ? (
          <div style={{ background: '#1e1500', border: '1px solid #2e2000', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)' }}>Select a category to manage its items</p>
          </div>
        ) : (
          <div style={{ background: '#1e1500', border: '1px solid #2e2000', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ color: '#f5c842', fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' }}>
              {selectedCat.icon} {selectedCat.name} — Items
            </h2>

            {items.map(item => (
              <div key={item.id} style={{ padding: '12px 14px', background: '#0a0600', borderRadius: '8px', border: '1px solid #2e2000', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {item.image_url && <img src={item.image_url} style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} alt="" />}
                  <div>
                    <div style={{ color: '#fafafa', fontSize: '13px' }}>{item.name}</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{item.price}{item.badge ? ` · ${item.badge}` : ''}{item.is_featured ? ' · ⭐' : ''}</div>
                  </div>
                </div>
                <div>
                  <button onClick={() => { setEditingItem(item); setItemForm({ name: item.name, description: item.description || '', price: item.price, price_cents: item.price_cents ? (item.price_cents / 100).toString() : '', badge: item.badge || '', image_url: item.image_url || '', is_featured: item.is_featured }) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', marginRight: '4px' }}>✏️</button>
                  <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px' }}>🗑️</button>
                </div>
              </div>
            ))}

            <div style={{ borderTop: '1px solid #2e2000', paddingTop: '20px', marginTop: '16px' }}>
              <p style={{ color: '#f5c842', fontSize: '10px', letterSpacing: '2px', marginBottom: '14px' }}>{editingItem ? 'EDIT' : 'ADD'} ITEM</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div><label style={labelStyle}>Name</label><input value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} /></div>
                <div><label style={labelStyle}>Display Price (e.g. R85)</label><input value={itemForm.price} onChange={e => setItemForm(f => ({ ...f, price: e.target.value }))} style={inputStyle} /></div>
                <div><label style={labelStyle}>Price in Rands (for cart, e.g. 85)</label><input type="number" min="0" step="0.01" value={itemForm.price_cents} onChange={e => setItemForm(f => ({ ...f, price_cents: e.target.value }))} placeholder="Leave blank for 'Ask us'" style={inputStyle} /></div>
                <div style={{ gridColumn: '1/-1' }}><label style={labelStyle}>Description</label><input value={itemForm.description} onChange={e => setItemForm(f => ({ ...f, description: e.target.value }))} style={inputStyle} /></div>
                <div><label style={labelStyle}>Badge (optional)</label><input value={itemForm.badge} onChange={e => setItemForm(f => ({ ...f, badge: e.target.value }))} placeholder="Fan Fav" style={inputStyle} /></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '18px' }}>
                  <input type="checkbox" id="feat" checked={itemForm.is_featured} onChange={e => setItemForm(f => ({ ...f, is_featured: e.target.checked }))} />
                  <label htmlFor="feat" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>Khula Favourite ⭐</label>
                </div>
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Image</label>
                <ImageUpload value={itemForm.image_url} onChange={url => setItemForm(f => ({ ...f, image_url: url }))} folder="menu" />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={saveItem} disabled={isPending || !itemForm.name} style={btn(true)}>{isPending ? '…' : editingItem ? 'Update' : 'Add Item'}</button>
                {editingItem && <button onClick={() => { setEditingItem(null); setItemForm({ name: '', description: '', price: 'Ask us', price_cents: '', badge: '', image_url: '', is_featured: false }) }} style={btn(false)}>Cancel</button>}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
