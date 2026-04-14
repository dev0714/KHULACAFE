'use client'
import Link from 'next/link'

const footerLinks = {
  Explore: [
    { href: '/', label: 'Home' },
    { href: '/menu', label: 'Our Menu' },
    { href: '/gallery', label: 'Gallery' },
    { href: '/about', label: 'About Us' },
  ],
  Experience: [
    { href: '/book', label: 'Reserve a Table' },
    { href: '/loyalty', label: 'Khula Bucks' },
    { href: '/loyalty#gold', label: 'Khula Gold' },
    { href: '/contact', label: 'Contact Us' },
  ],
}

export default function Footer() {
  return (
    <footer style={{ background: '#020805', borderTop: '1px solid #1a3a22', paddingTop: '72px' }}>
      <div className="section-wrap">
        <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '48px', paddingBottom: '48px' }}>

          {/* Brand */}
          <div>
            <div style={{ marginBottom: '20px', lineHeight: 1 }}>
              <div style={{ fontFamily: 'var(--font-playfair)', fontWeight: 900, letterSpacing: '3px', lineHeight: 0.92 }}>
                <span style={{ display: 'block', fontSize: '26px', color: '#fafafa' }}>KHULA</span>
                <span style={{ display: 'block', fontSize: '26px', color: '#57cc99' }}>CAFE</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                <div style={{ height: '1px', flex: 1, background: '#c4a265', opacity: 0.5 }} />
                <span style={{ fontSize: '7px', letterSpacing: '3px', color: '#c4a265', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  Best of the Best
                </span>
                <div style={{ height: '1px', flex: 1, background: '#c4a265', opacity: 0.5 }} />
              </div>
            </div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.8, maxWidth: '260px' }}>
              Where memories are made, smiles are created, and every conversation begins over a great cup of coffee.
            </p>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', lineHeight: 1.7, marginTop: '12px' }}>
              📍 Cnr Old Main Road & St Johns Avenue<br />Dickswell Centre, Pinetown<br />📞 061 489 4615
            </p>
            {/* Social */}
            <div style={{ display: 'flex', gap: '14px', marginTop: '24px' }}>
              {['📘', '📸', '🐦', '💬'].map((icon, i) => (
                <button key={i} style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: '#0d2818', border: '1px solid #1a3a22',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '15px', cursor: 'pointer', transition: 'background 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#1a3a22'}
                  onMouseLeave={e => e.currentTarget.style.background = '#0d2818'}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: '#c4a265', marginBottom: '20px' }}>
                {heading}
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {links.map(link => (
                  <li key={link.href}>
                    <Link href={link.href} style={{
                      textDecoration: 'none', fontSize: '13px',
                      color: 'rgba(255,255,255,0.5)', transition: 'color 0.2s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.color = '#57cc99'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Hours */}
          <div>
            <h4 style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: '#c4a265', marginBottom: '20px' }}>
              Hours
            </h4>
            {[
              { day: 'Mon – Thu', hours: '08:00 – 21:00' },
              { day: 'Fri – Sat', hours: '08:00 – 23:00' },
              { day: 'Sunday', hours: '09:00 – 20:00' },
              { day: 'Public Holidays', hours: '09:00 – 18:00' },
            ].map(item => (
              <div key={item.day} style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px' }}>{item.day}</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{item.hours}</div>
              </div>
            ))}
            {/* Loadshedding badge */}
            <div style={{
              marginTop: '20px', padding: '10px 14px', borderRadius: '8px',
              background: '#0d2818', border: '1px solid #1a3a22',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <span className="pulse-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#39ff14', display: 'block', flexShrink: 0 }} />
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>
                Open & cooking on gas/generators
              </span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom" style={{
          borderTop: '1px solid #1a3a22', padding: '20px 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px',
        }}>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>
            © {new Date().getFullYear()} Khula Cafe. All rights reserved.
          </p>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', letterSpacing: '1px' }}>
            Best of the Best ✦ South African Hospitality
          </p>
        </div>
      </div>
    </footer>
  )
}
