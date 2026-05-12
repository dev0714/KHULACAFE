const sections = [
  { href: '/admin/menu', label: 'Menu', icon: '🍽️', desc: 'Edit categories, items & prices' },
  { href: '/admin/gallery', label: 'Gallery', icon: '📸', desc: 'Upload & reorder photos' },
  { href: '/admin/loyalty', label: 'Khula Bucks', icon: '💛', desc: 'Configure earn rates & Gold tier' },
  { href: '/admin/bookings', label: 'Bookings', icon: '📅', desc: 'Manage occasions & add-ons' },
]

export default function AdminDashboard() {
  return (
    <>
      <h1 style={{ fontFamily: 'var(--font-playfair)', color: '#fafafa', fontSize: '32px', marginBottom: '8px' }}>
        Dashboard
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '40px' }}>
        Welcome back. What would you like to manage?
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
