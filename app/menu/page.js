'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase-public'

export default function MenuPage() {
  const [menuCategories, setMenuCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState('')

  useEffect(() => {
    supabase
      .from('menu_categories')
      .select('*, menu_items(*)')
      .order('sort_order')
      .then(({ data }) => {
        if (data) setMenuCategories(data.map(cat => ({
          ...cat,
          items: (cat.menu_items || []).sort((a, b) => a.sort_order - b.sort_order),
        })))
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

      {/* Category tabs */}
      <div style={{
        position: 'sticky', top: '62px', zIndex: 100,
        background: 'rgba(10,6,0,0.97)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid #2e2000',
        padding: '0 32px',
        overflowX: 'auto', whiteSpace: 'nowrap', scrollbarWidth: 'none',
      }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {current.items.map((item) => (
              <div key={item.id} className="card-lift" style={{
                background: '#1e1500', border: '1px solid #2e2000', borderRadius: '14px',
                padding: '28px', position: 'relative', overflow: 'hidden',
              }}>
                {item.badge && (
                  <span style={{
                    position: 'absolute', top: '18px', right: '18px',
                    background: '#f5c842', color: '#0a0600',
                    fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase',
                    padding: '4px 10px', borderRadius: '20px',
                  }}>{item.badge}</span>
                )}
                <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '20px', color: '#fafafa', marginBottom: '10px' }}>
                  {item.name}
                </h3>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, marginBottom: '24px' }}>
                  {item.description}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '24px', color: '#f5c842', fontWeight: 600 }}>
                    {item.price}
                  </span>
                  <Link href="/book" style={{
                    textDecoration: 'none', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase',
                    fontWeight: 600, color: '#0a0600', padding: '8px 18px', borderRadius: '30px',
                    background: 'linear-gradient(135deg, #f5c842, #c8940c)',
                  }}>
                    Order
                  </Link>
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
