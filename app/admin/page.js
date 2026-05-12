'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase-public'

const sections = [
  { href: '/admin/menu', label: 'Menu', icon: '🍽️', desc: 'Edit categories, items & prices' },
  { href: '/admin/gallery', label: 'Gallery', icon: '📸', desc: 'Upload & reorder photos' },
  { href: '/admin/loyalty', label: 'Khula Bucks', icon: '💛', desc: 'Configure earn rates & Gold tier' },
  { href: '/admin/bookings', label: 'Bookings', icon: '📅', desc: 'Manage occasions & add-ons' },
]

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    categories: 0, items: 0, featured: 0,
    gallery: 0, atmosphere: 0, occasions: 0, addons: 0,
  })

  useEffect(() => {
    Promise.all([
      supabase.from('menu_categories').select('id', { count: 'exact', head: true }),
      supabase.from('menu_items').select('id', { count: 'exact', head: true }),
      supabase.from('menu_items').select('id', { count: 'exact', head: true }).eq('is_featured', true),
      supabase.from('gallery_items').select('id', { count: 'exact', head: true }).eq('is_atmosphere', false),
      supabase.from('gallery_items').select('id', { count: 'exact', head: true }).eq('is_atmosphere', true),
      supabase.from('booking_occasions').select('id', { count: 'exact', head: true }),
      supabase.from('booking_addons').select('id', { count: 'exact', head: true }),
    ]).then(([cats, items, featured, gallery, atm, occ, addons]) => {
      setStats({
        categories: cats.count ?? 0,
        items: items.count ?? 0,
        featured: featured.count ?? 0,
        gallery: gallery.count ?? 0,
        atmosphere: atm.count ?? 0,
        occasions: occ.count ?? 0,
        addons: addons.count ?? 0,
      })
    })
  }, [])

  const statCards = [
    { label: 'Menu Categories', value: stats.categories, icon: '🗂️' },
    { label: 'Menu Items', value: stats.items, icon: '🍽️' },
    { label: 'Featured Items', value: stats.featured, icon: '⭐' },
    { label: 'Gallery Photos', value: stats.gallery, icon: '📸' },
    { label: 'Atmosphere Photos', value: stats.atmosphere, icon: '🏛️' },
    { label: 'Occasions', value: stats.occasions, icon: '🎉' },
    { label: 'Add-Ons', value: stats.addons, icon: '🎁' },
  ]

  return (
    <>
      <h1 style={{ fontFamily: 'var(--font-playfair)', color: '#fafafa', fontSize: '32px', marginBottom: '4px' }}>
        Dashboard
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '40px' }}>
        Welcome back. Here's an overview of your content.
      </p>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '40px' }}>
        {statCards.map(s => (
          <div key={s.label} style={{
            background: '#1e1500', border: '1px solid #2e2000', borderRadius: '12px', padding: '20px 18px',
          }}>
            <div style={{ fontSize: '22px', marginBottom: '10px' }}>{s.icon}</div>
            <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '28px', fontWeight: 700, color: '#f5c842', lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.5px', marginTop: '6px', lineHeight: 1.4 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Section cards */}
      <p style={{ fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '16px' }}>
        Manage
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {sections.map(s => (
          <a key={s.href} href={s.href} style={{
            textDecoration: 'none', background: '#1e1500', border: '1px solid #2e2000',
            borderRadius: '12px', padding: '28px', transition: 'border-color 0.2s', display: 'block',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#f5c842'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#2e2000'}
          >
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>{s.icon}</div>
            <h3 style={{ color: '#f5c842', fontSize: '16px', marginBottom: '6px' }}>{s.label}</h3>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', lineHeight: 1.5 }}>{s.desc}</p>
          </a>
        ))}
      </div>
    </>
  )
}
