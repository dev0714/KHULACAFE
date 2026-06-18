'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase-public'
import { useCart } from '../../lib/cart-context'

export default function MenuPage() {
  const { addItem, items } = useCart()
  const [menuCategories, setMenuCategories] = useState([])
  const [allMenuItems, setAllMenuItems] = useState([]) // flat list for search
  const [activeCategory, setActiveCategory] = useState('')
  const [activeSubcategory, setActiveSubcategory] = useState(null) // null = All
  const [searchQuery, setSearchQuery] = useState('')
  const [showGlance, setShowGlance] = useState(false)
  const tabsRef = useRef(null)
  const searchRef = useRef(null)
  const dragState = useRef({ down: false, startX: 0, scrollLeft: 0 })

  function onMouseDown(e) {
    const el = tabsRef.current
    dragState.current = { down: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft }
    el.style.cursor = 'grabbing'
  }
  function onMouseLeave() {
    dragState.current.down = false
    if (tabsRef.current) tabsRef.current.style.cursor = 'grab'
  }
  function onMouseUp() {
    dragState.current.down = false
    if (tabsRef.current) tabsRef.current.style.cursor = 'grab'
  }
  function onMouseMove(e) {
    if (!dragState.current.down) return
    e.preventDefault()
    const el = tabsRef.current
    const x = e.pageX - el.offsetLeft
    el.scrollLeft = dragState.current.scrollLeft - (x - dragState.current.startX) * 1.5
  }

  function cartQty(itemId) {
    return items.find(i => i.id === itemId)?.qty ?? 0
  }

  useEffect(() => {
    // Fetch flat item list separately so search has all items reliably
    supabase
      .from('menu_items')
      .select('id, name, description, badge, price, price_cents, image_url, category_id, subcategory_id, menu_categories(name, icon), menu_subcategories(name)')
      .order('sort_order')
      .then(({ data }) => { if (data) setAllMenuItems(data) })
  }, [])

  useEffect(() => {
    Promise.all([
      supabase.from('menu_categories').select('*, menu_items(*)').order('sort_order'),
      supabase.from('menu_subcategories').select('*').order('sort_order'),
    ]).then(([{ data: cats }, { data: subs }]) => {
      if (!cats) return
      const subMap = {}
      for (const s of subs || []) {
        if (!subMap[s.category_id]) subMap[s.category_id] = []
        subMap[s.category_id].push(s)
      }
      setMenuCategories(cats.map(cat => {
        const catSubs = subMap[cat.id] || []
        const allItems = (cat.menu_items || []).sort((a, b) => a.sort_order - b.sort_order)
        const groups = []
        for (const sub of catSubs) {
          const subItems = allItems.filter(i => i.subcategory_id === sub.id)
          if (subItems.length > 0) groups.push({ sub, items: subItems })
        }
        const uncategorised = allItems.filter(i => !i.subcategory_id)
        if (uncategorised.length > 0) groups.push({ sub: null, items: uncategorised })
        return { ...cat, groups, items: allItems }
      }))
    })
  }, [])

  useEffect(() => {
    if (menuCategories.length > 0 && !activeCategory) {
      setActiveCategory(menuCategories[0]?.id)
    }
  }, [menuCategories])

  useEffect(() => {
    setActiveSubcategory(null)
  }, [activeCategory])

  // Search across the flat item list — reliable regardless of join state
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return null
    const matched = allMenuItems.filter(item =>
      item.name?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.badge?.toLowerCase().includes(q) ||
      item.menu_subcategories?.name?.toLowerCase().includes(q) ||
      item.menu_categories?.name?.toLowerCase().includes(q)
    )
    // Group by category for display
    const byCategory = {}
    for (const item of matched) {
      const catId = item.category_id
      if (!byCategory[catId]) {
        byCategory[catId] = {
          id: catId,
          name: item.menu_categories?.name || 'Other',
          icon: item.menu_categories?.icon || '',
          matchedItems: [],
        }
      }
      byCategory[catId].matchedItems.push(item)
    }
    return Object.values(byCategory)
  }, [searchQuery, allMenuItems])

  const current = menuCategories.find(c => c.id === activeCategory) || menuCategories[0]
  const totalItems = menuCategories.reduce((n, c) => n + (c.items?.length || 0), 0)

  function selectCategory(id) {
    setActiveCategory(id)
    setShowGlance(false)
    setSearchQuery('')
  }

  return (
    <>
      {/* Page hero */}
      <div className="page-hero" style={{ borderBottom: '1px solid #2e2000' }}>
        <p className="section-label">What We Serve</p>
        <h1 style={{ fontFamily: 'var(--font-playfair)' }}>Our Menu</h1>
        <p>Authentic South African flavours, crafted with love and served with pride.</p>
      </div>

      {/* Sticky bar: search + tabs */}
      <div style={{
        position: 'sticky', top: '62px', zIndex: 100,
        background: 'rgba(10,6,0,0.97)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid #2e2000',
      }}>
        {/* Search row */}
        <div style={{ padding: '10px 16px', display: 'flex', gap: '8px', alignItems: 'center', borderBottom: '1px solid rgba(46,32,0,0.5)' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', pointerEvents: 'none', color: 'rgba(255,255,255,0.3)' }}>🔍</span>
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search menu items…"
              style={{
                width: '100%', padding: '9px 36px 9px 36px',
                background: '#1e1500', border: '1px solid #2e2000', borderRadius: '10px',
                color: '#fafafa', fontSize: '13px', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{
                position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '16px', lineHeight: 1, padding: '2px',
              }}>✕</button>
            )}
          </div>
          {/* Browse all button */}
          <button
            onClick={() => { setShowGlance(v => !v); setSearchQuery('') }}
            title="Browse all categories"
            style={{
              flexShrink: 0, padding: '9px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
              background: showGlance ? 'linear-gradient(135deg,#f5c842,#c8940c)' : '#2e2000',
              color: showGlance ? '#0a0600' : '#f5c842',
              whiteSpace: 'nowrap',
            }}
          >
            ☰ All
          </button>
        </div>

        {/* Category tabs — hidden when search active or glance open */}
        {!searchQuery && !showGlance && (
          <>
            <div
              ref={tabsRef}
              className="menu-tabs-bar"
              style={{
                overflowX: 'auto', whiteSpace: 'nowrap',
                scrollbarWidth: 'none', msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
                padding: '0 32px',
                cursor: 'grab', userSelect: 'none',
              }}
              onMouseDown={onMouseDown}
              onMouseLeave={onMouseLeave}
              onMouseUp={onMouseUp}
              onMouseMove={onMouseMove}
            >
              <div style={{ display: 'inline-flex', gap: '0' }}>
                {menuCategories.map(cat => (
                  <button key={cat.id} onClick={() => setActiveCategory(cat.id)} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '16px 24px',
                    fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase',
                    fontWeight: 600,
                    color: activeCategory === cat.id ? '#f5c842' : 'rgba(255,255,255,0.45)',
                    borderBottom: activeCategory === cat.id ? '2px solid #f5c842' : '2px solid transparent',
                    transition: 'all 0.2s', whiteSpace: 'nowrap',
                  }}>
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Subcategory pill tabs — only shown when current category has named subs */}
            {current && current.groups?.some(g => g.sub) && (
              <div style={{
                overflowX: 'auto', whiteSpace: 'nowrap',
                scrollbarWidth: 'none', msOverflowStyle: 'none',
                padding: '8px 16px', display: 'flex', gap: '6px',
                borderTop: '1px solid rgba(46,32,0,0.5)',
              }}>
                <button
                  onClick={() => setActiveSubcategory(null)}
                  style={{
                    flexShrink: 0, padding: '6px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                    fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px',
                    background: activeSubcategory === null ? 'linear-gradient(135deg,#f5c842,#c8940c)' : '#2e2000',
                    color: activeSubcategory === null ? '#0a0600' : 'rgba(255,255,255,0.55)',
                    transition: 'all 0.15s',
                  }}
                >
                  All
                </button>
                {current.groups.filter(g => g.sub).map(g => (
                  <button
                    key={g.sub.id}
                    onClick={() => setActiveSubcategory(g.sub.id)}
                    style={{
                      flexShrink: 0, padding: '6px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                      fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px',
                      background: activeSubcategory === g.sub.id ? 'linear-gradient(135deg,#f5c842,#c8940c)' : '#2e2000',
                      color: activeSubcategory === g.sub.id ? '#0a0600' : 'rgba(255,255,255,0.55)',
                      transition: 'all 0.15s', whiteSpace: 'nowrap',
                    }}
                  >
                    {g.sub.name}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── At-a-glance overlay ── */}
      {showGlance && (
        <div style={{ background: '#0a0600', minHeight: '60vh', padding: '24px 16px 40px' }}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <p style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '20px' }}>
              {menuCategories.length} categories · {totalItems} items
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {menuCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => selectCategory(cat.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    padding: '16px 20px', borderRadius: '12px',
                    background: 'transparent', border: '1px solid transparent',
                    cursor: 'pointer', textAlign: 'left', width: '100%',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#1e1500'; e.currentTarget.style.borderColor = '#2e2000' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}
                >
                  <span style={{ fontSize: '32px', width: '44px', textAlign: 'center', flexShrink: 0 }}>{cat.icon || '🍽️'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#fafafa', marginBottom: '2px' }}>{cat.name}</div>
                    {cat.description && (
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '260px' }}>{cat.description}</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>{cat.items?.length || 0} items</span>
                    <span style={{ color: '#f5c842', fontSize: '16px' }}>›</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Search results ── */}
      {searchQuery && searchResults !== null && (
        <section style={{ padding: '32px 0 40px', background: '#0a0600', minHeight: '60vh' }}>
          <div className="section-wrap">
            {searchResults.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.3)' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                <p style={{ fontSize: '16px' }}>No items found for "{searchQuery}"</p>
              </div>
            ) : (
              <>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginBottom: '28px', letterSpacing: '1px' }}>
                  {searchResults.reduce((n, c) => n + c.matchedItems.length, 0)} result{searchResults.reduce((n, c) => n + c.matchedItems.length, 0) !== 1 ? 's' : ''} for "{searchQuery}"
                </p>
                {searchResults.map(cat => (
                  <div key={cat.id} style={{ marginBottom: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                      <span style={{ fontSize: '20px' }}>{cat.icon}</span>
                      <h3 style={{ fontSize: '13px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{cat.name}</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                      {cat.matchedItems.map(item => (
                        <div key={item.id}>
                          {item.menu_subcategories?.name && (
                            <p style={{ fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(245,200,66,0.5)', marginBottom: '6px', paddingLeft: '4px' }}>
                              {item.menu_subcategories.name}
                            </p>
                          )}
                          <ItemCard item={item} cartQty={cartQty} addItem={addItem} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </section>
      )}

      {/* ── Normal category view ── */}
      {!searchQuery && !showGlance && (
        <section style={{ padding: '60px 0 40px', background: '#0a0600' }}>
          <div className="section-wrap">
            {current && (
              <div style={{ marginBottom: '48px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '36px' }}>{current.icon}</span>
                  <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 700, color: '#fafafa' }}>
                    {current.name}
                  </h2>
                </div>
                <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.5)', maxWidth: '500px', lineHeight: 1.7 }}>
                  {current.description}
                </p>
              </div>
            )}

            {current && (
              <div>
                {(current.groups?.length > 0 ? current.groups : [{ sub: null, items: current.items }])
                  .filter(g => activeSubcategory === null || (g.sub?.id === activeSubcategory) || (!g.sub && activeSubcategory === null))
                  .filter(g => activeSubcategory === null ? true : g.sub?.id === activeSubcategory)
                  .map((group, gi) => (
                    <div key={gi} style={{ marginBottom: '40px' }}>
                      {group.sub?.description && (
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '20px' }}>{group.sub.description}</p>
                      )}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                        {group.items.map(item => (
                          <ItemCard key={item.id} item={item} cartQty={cartQty} addItem={addItem} />
                        ))}
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        </section>
      )}

      {/* CTA */}
      {!searchQuery && !showGlance && (
        <section style={{ padding: '80px 32px', textAlign: 'center', background: '#140e00', borderTop: '1px solid #2e2000' }}>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '12px', lineHeight: 1.7 }}>
            Want the full experience? Reserve a table and we'll bring the food to you.
          </p>
          <Link href="/book" style={{
            textDecoration: 'none', fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase',
            fontWeight: 600, color: '#0a0600', padding: '14px 40px', borderRadius: '50px',
            background: 'linear-gradient(135deg, #f5c842, #c8940c)',
            boxShadow: '0 6px 20px rgba(200,148,12,0.4)', display: 'inline-block', marginTop: '8px',
          }}>
            Reserve a Table
          </Link>
        </section>
      )}
    </>
  )
}

function ItemCard({ item, cartQty, addItem }) {
  const qty = cartQty(item.id)
  return (
    <div className="card-lift" style={{
      background: '#1e1500', border: '1px solid #2e2000', borderRadius: '14px',
      overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column',
    }}>
      {item.image_url && (
        <div style={{ position: 'relative', height: '200px', flexShrink: 0 }}>
          <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(30,21,0,0.7) 0%, transparent 60%)' }} />
          {item.badge && (
            <span style={{ position: 'absolute', top: '14px', right: '14px', background: '#f5c842', color: '#0a0600', fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '20px' }}>{item.badge}</span>
          )}
        </div>
      )}
      <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {!item.image_url && item.badge && (
          <span style={{ alignSelf: 'flex-start', marginBottom: '12px', background: '#f5c842', color: '#0a0600', fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '20px' }}>{item.badge}</span>
        )}
        <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '20px', color: '#fafafa', marginBottom: '8px' }}>{item.name}</h3>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, marginBottom: '20px', flex: 1 }}>{item.description}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
          <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '24px', color: '#f5c842', fontWeight: 600 }}>{item.price}</span>
          {item.price_cents ? (
            <button onClick={() => addItem({ id: item.id, name: item.name, price_cents: item.price_cents, image_url: item.image_url || null })}
              style={{ fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 700, color: '#0a0600', padding: '8px 18px', borderRadius: '30px', background: qty > 0 ? 'linear-gradient(135deg, #c8940c, #a07008)' : 'linear-gradient(135deg, #f5c842, #c8940c)', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}>
              {qty > 0 ? `In Cart (${qty})` : 'Add to Cart'}
            </button>
          ) : (
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px' }}>Call to order</span>
          )}
        </div>
      </div>
    </div>
  )
}
