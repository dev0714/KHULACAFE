'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/menu', label: 'Menu' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/about', label: 'About' },
  { href: '/loyalty', label: 'Loyalty' },
  { href: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        padding: scrolled ? '10px 40px' : '22px 40px',
        background: scrolled
          ? 'linear-gradient(105deg, #3d2200cc, #7d5a0bcc 40%, #c8940ccc 55%, #7d5a0bcc 70%, #3d2200cc)'
          : 'transparent',
        backdropFilter: scrolled ? 'blur(24px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(46,32,0,0.7)' : 'none',
        transition: 'all 0.4s cubic-bezier(0.25,0.46,0.45,0.94)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', lineHeight: 1 }}>
          <img
            src="/images/logo.png"
            alt="Khula Cafe"
            width={64}
            height={80}
            style={{ display: 'block' }}
          />
        </Link>

        {/* Desktop links — absolutely centred */}
        <div className="hide-mobile" style={{
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: '36px', alignItems: 'center',
        }}>
          {navLinks.map(link => {
            const active = pathname === link.href
            const onGoldHero = pathname === '/' && !scrolled
            const activeColor = onGoldHero ? '#3d2200' : '#f5c842'
            const defaultColor = onGoldHero ? '#0a0600' : 'rgba(255,255,255,0.65)'
            const hoverColor = onGoldHero ? '#3d2200' : '#fff'
            return (
              <Link key={link.href} href={link.href} style={{
                textDecoration: 'none',
                fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 500,
                color: active ? activeColor : defaultColor,
                borderBottom: active ? `1px solid ${activeColor}` : '1px solid transparent',
                paddingBottom: '3px',
                transition: 'color 0.2s, border-color 0.2s',
              }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = hoverColor }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = defaultColor }}
              >
                {link.label}
              </Link>
            )
          })}
        </div>

        {/* CTA + hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/book" className="hide-mobile" style={{
            textDecoration: 'none', fontSize: '11px', letterSpacing: '2.5px',
            textTransform: 'uppercase', fontWeight: 600, color: '#0a0600',
            padding: '10px 24px', borderRadius: '40px',
            background: 'linear-gradient(135deg, #f5c842, #c8940c)',
            boxShadow: '0 4px 18px rgba(200,148,12,0.45)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(200,148,12,0.6)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(200,148,12,0.45)' }}
          >
            Reserve Now
          </Link>

          {/* Hamburger */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Toggle menu"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', display: 'flex', flexDirection: 'column', gap: '5px' }}
            className="show-mobile-only"
          >
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                display: 'block', width: '22px', height: '2px',
                background: mobileOpen ? '#f5c842' : ((pathname === '/' && !scrolled) ? '#0a0600' : '#fafafa'),
                borderRadius: '2px',
                transform: mobileOpen
                  ? i === 0 ? 'rotate(45deg) translateY(7px)' : i === 2 ? 'rotate(-45deg) translateY(-7px)' : 'none'
                  : 'none',
                opacity: mobileOpen && i === 1 ? 0 : 1,
                transition: 'all 0.3s',
              }} />
            ))}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 999,
        background: 'rgba(10,6,0,0.98)', backdropFilter: 'blur(24px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '40px',
        transition: 'opacity 0.3s, transform 0.3s',
        opacity: mobileOpen ? 1 : 0,
        transform: mobileOpen ? 'none' : 'translateY(-100%)',
        pointerEvents: mobileOpen ? 'auto' : 'none',
      }}>
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href} style={{
            textDecoration: 'none',
            fontFamily: 'var(--font-playfair)', fontSize: '28px', fontWeight: 600,
            letterSpacing: '5px', textTransform: 'uppercase',
            color: pathname === link.href ? '#f5c842' : 'rgba(255,255,255,0.8)',
            transition: 'color 0.2s',
          }}>
            {link.label}
          </Link>
        ))}
        <Link href="/book" onClick={() => setMobileOpen(false)} style={{
          textDecoration: 'none', marginTop: '8px',
          fontSize: '13px', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: 600,
          color: '#0a0600', padding: '14px 48px', borderRadius: '40px',
          background: 'linear-gradient(135deg, #f5c842, #c8940c)',
          boxShadow: '0 4px 20px rgba(200,148,12,0.5)',
        }}>
          Reserve Now
        </Link>
      </div>
    </>
  )
}
