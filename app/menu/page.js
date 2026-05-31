'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase-public'
import { useCart } from '../../lib/cart-context'

export default function MenuPage() {
  const { addItem, items } = useCart()
  const [menuCategories, setMenuCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState('')
  const tabsRef = useRef(null)
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
        // Group items by subcategory; uncategorised items last
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

  const current = menuCategories.find(c => c.id === activeCategory) || menuCategories[0]

  return (
    <>
      {/* Page hero */}
      <div className="page-hero" style={{ borderBottom: '1px solid #2e2000' }}>
        <p className="section-label">What We Serve</p>
        <h1 style={{ fontFamily: 'var(--font-playfair)' }}>Our Menu</h1>
        <p>Authentic South African flavours, crafted with love and served with pride.</p>
      </div>

      {/* Category tabs — sticky wrapper + separate scroll wrapper to avoid CSS conflict */}
      <div style={{
        position: 'sticky', top: '62px', zIndex: 100,
        background: 'rgba(10,6,0,0.97)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid #2e2000',
      }}>
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
                padding: '18px 24px',
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
      </div>

      {/* Category section */}
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
              {(current.groups?.length > 0 ? current.groups : [{ sub: null, items: current.items }]).map((group, gi) => (
                <div key={gi} style={{ marginBottom: '48px' }}>
                  {/* Subcategory heading */}
                  {group.sub && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                      <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, #2e2000, transparent)' }} />
                      <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(18px, 2.5vw, 26px)', color: '#f5c842', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {group.sub.name}
                      </h3>
                      <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, #2e2000)' }} />
                    </div>
                  )}
                  {group.sub?.description && (
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '20px', textAlign: 'center' }}>{group.sub.description}</p>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                    {group.items.map((item) => (
                      <div key={item.id} className="card-lift" style={{
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
                                style={{ fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 700, color: '#0a0600', padding: '8px 18px', borderRadius: '30px', background: cartQty(item.id) > 0 ? 'linear-gradient(135deg, #c8940c, #a07008)' : 'linear-gradient(135deg, #f5c842, #c8940c)', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}>
                                {cartQty(item.id) > 0 ? `In Cart (${cartQty(item.id)})` : 'Add to Cart'}
                              </button>
                            ) : (
                              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px' }}>Call to order</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
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
    </>
  )
}
