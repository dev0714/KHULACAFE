'use client'
import Link from 'next/link'
import Image from 'next/image'

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
    <footer style={{ background: '#0a0600', borderTop: '1px solid #2e2000', paddingTop: '72px' }}>
      <div className="section-wrap">
        <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '48px', paddingBottom: '48px' }}>

          {/* Brand */}
          <div>
            <div style={{ marginBottom: '20px', lineHeight: 0, display: 'inline-block' }}>
              <img
                src="/images/logo.png"
                alt="Khula Cafe"
                width={90}
                height={113}
                style={{ display: 'block' }}
              />
            </div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.8, maxWidth: '260px' }}>
              Where memories are made, smiles are created, and every conversation begins over a great cup of coffee.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: '#f5c842', marginBottom: '20px' }}>
                {heading}
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {links.map(link => (
                  <li key={link.href}>
                    <Link href={link.href} style={{
                      textDecoration: 'none', fontSize: '13px',
                      color: 'rgba(255,255,255,0.5)', transition: 'color 0.2s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.color = '#f5c842'}
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
            <h4 style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: '#f5c842', marginBottom: '20px' }}>
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
            {/* Status badge */}
            <div style={{
              marginTop: '20px', padding: '10px 14px', borderRadius: '8px',
              background: '#1e1500', border: '1px solid #2e2000',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <span className="pulse-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f5c842', display: 'block', flexShrink: 0 }} />
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>
                Open & cooking on gas/generators
              </span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom" style={{
          borderTop: '1px solid #2e2000', padding: '20px 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px',
        }}>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>
            © {new Date().getFullYear()} Khula Cafe. All rights reserved.
          </p>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', letterSpacing: '1px' }}>
            Best of the Best ✦ South African Hospitality
          </p>
          <Link href="/staff-login" style={{
            fontSize: '10px', color: 'rgba(255,255,255,0.25)', letterSpacing: '1px',
            textDecoration: 'none', transition: 'color 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
          >
            Staff
          </Link>
        </div>
      </div>
    </footer>
  )
}
